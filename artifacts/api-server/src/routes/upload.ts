import { Router } from "express";
import fs from "fs";
import path from "path";
import { logger } from "../lib/logger";

const router = Router();
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

router.post("/upload", async (req, res) => {
  try {
    const { base64Data, fileName } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: "Missing base64Data content" });
    }

    const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    let buffer: Buffer;
    let ext = "";
    let mimeType = "";

    if (matches && matches.length === 3) {
      mimeType = matches[1];
      buffer = Buffer.from(matches[2], "base64");
      ext = mimeType.split("/")[1] || "";
    } else {
      buffer = Buffer.from(base64Data, "base64");
    }

    const isImageMime = mimeType.startsWith("image/") || (fileName && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName));
    if (isImageMime && buffer.length < 850 * 1024) {
      const finalUrl = base64Data.startsWith("data:") ? base64Data : `data:${mimeType || "image/png"};base64,${base64Data}`;
      logger.info({ size: buffer.length }, "Served small image as base64 data URI");
      return res.json({ success: true, url: finalUrl });
    }

    if (!ext && fileName) {
      const rawExt = path.extname(fileName).toLowerCase().replace(".", "");
      if (rawExt) ext = rawExt;
    }
    if (ext === "quicktime") ext = "mov";
    if (ext === "jpeg") ext = "jpg";
    if (ext === "svg+xml") ext = "svg";

    const safeExt = ext ? `.${ext}` : "";
    const uniqueName = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}${safeExt}`;

    try {
      logger.info({ fileName: uniqueName }, "Attempting Pixeldrain upload");
      const nameClean = encodeURIComponent(fileName || `upload_${Date.now()}${safeExt}`);
      const pdRes = await fetch(`https://pixeldrain.com/api/file/${nameClean}`, {
        method: "PUT",
        body: buffer
      });
      if (pdRes.ok) {
        const pdData = await pdRes.json() as any;
        if (pdData?.success && pdData?.id) {
          const uploadedUrl = `https://pixeldrain.com/api/file/${pdData.id}`;
          logger.info({ url: uploadedUrl }, "Pixeldrain PUT upload success");
          return res.json({ success: true, url: uploadedUrl });
        }
      }
    } catch (pdErr: any) {
      logger.warn({ err: pdErr }, "Pixeldrain PUT failed");
    }

    try {
      const fileType = mimeType || "application/octet-stream";
      const fileBlob = new Blob([buffer], { type: fileType });
      const pFormData = new FormData();
      pFormData.append("file", fileBlob, fileName || `upload_${Date.now()}${safeExt}`);
      const pdRes = await fetch("https://pixeldrain.com/api/file", { method: "POST", body: pFormData });
      if (pdRes.ok) {
        const pdData = await pdRes.json() as any;
        if (pdData?.success && pdData?.id) {
          const uploadedUrl = `https://pixeldrain.com/api/file/${pdData.id}`;
          return res.json({ success: true, url: uploadedUrl });
        }
      }
    } catch (pdPostErr: any) {
      logger.warn({ err: pdPostErr }, "Pixeldrain multipart failed");
    }

    const filePath = path.join(UPLOADS_DIR, uniqueName);
    fs.writeFileSync(filePath, buffer);
    logger.info({ path: filePath, size: buffer.length }, "Saved file to local disk");
    return res.json({ success: true, url: `/uploads/${uniqueName}` });
  } catch (err: any) {
    logger.error({ err }, "POST /upload error");
    return res.status(500).json({ error: `Upload failed: ${err.message || err}` });
  }
});

router.get("/media-proxy", async (req, res) => {
  try {
    const targetUrl = req.query.url as string;
    if (!targetUrl) return res.status(400).send("Missing target url parameter");

    if (targetUrl.startsWith("/uploads/") || targetUrl.includes("/uploads/")) {
      const fileName = targetUrl.substring(targetUrl.lastIndexOf("/") + 1);
      const filePath = path.join(UPLOADS_DIR, fileName);
      if (!fs.existsSync(filePath)) return res.status(404).send("Local file not found");

      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = req.headers.range;
      const contentType = targetUrl.toLowerCase().endsWith(".mov") ? "video/quicktime" : "video/mp4";

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        if (start >= fileSize || end >= fileSize) {
          res.status(416);
          res.setHeader("Content-Range", `bytes */${fileSize}`);
          return res.end();
        }
        const chunksize = (end - start) + 1;
        const fileStream = fs.createReadStream(filePath, { start, end });
        res.status(206);
        res.setHeader("Content-Range", `bytes ${start}-${end}/${fileSize}`);
        res.setHeader("Accept-Ranges", "bytes");
        res.setHeader("Content-Length", chunksize);
        res.setHeader("Content-Type", contentType);
        res.setHeader("Access-Control-Allow-Origin", "*");
        fileStream.pipe(res);
      } else {
        res.status(200);
        res.setHeader("Content-Length", fileSize);
        res.setHeader("Content-Type", contentType);
        res.setHeader("Accept-Ranges", "bytes");
        res.setHeader("Access-Control-Allow-Origin", "*");
        fs.createReadStream(filePath).pipe(res);
      }
      return;
    }

    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    };
    if (req.headers.range) headers["Range"] = req.headers.range;

    const response = await fetch(targetUrl, { method: "GET", headers });
    if (!response.ok && response.status !== 206) {
      return res.status(response.status).send(`Target returned error status ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "video/mp4";
    const contentLength = response.headers.get("content-length");
    const contentRange = response.headers.get("content-range");
    const acceptRanges = response.headers.get("accept-ranges");

    res.status(response.status);
    res.setHeader("Content-Type", contentType);
    if (contentLength) res.setHeader("Content-Length", contentLength);
    if (contentRange) res.setHeader("Content-Range", contentRange);
    res.setHeader("Accept-Ranges", acceptRanges || "bytes");
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (response.body) {
      const reader = response.body.getReader();
      const pump = async () => {
        const { done, value } = await reader.read();
        if (done) { res.end(); return; }
        if (value) res.write(Buffer.from(value));
        pump();
      };
      await pump();
    } else {
      res.end();
    }
  } catch (err: any) {
    logger.error({ err }, "GET /media-proxy error");
    if (!res.headersSent) res.status(500).send("Media stream error");
  }
});

export default router;
