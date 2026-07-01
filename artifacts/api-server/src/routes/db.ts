import { Router } from "express";
import fs from "fs";
import path from "path";
import { logger } from "../lib/logger";

const router = Router();

const DB_FILE = path.join(process.cwd(), "database.json");
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const sseClients: Set<any> = new Set();

export function notifyClients(event: string, data: any) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((res) => {
    try {
      res.write(payload);
    } catch {
      sseClients.delete(res);
    }
  });
}

export function getOrCreateDatabase(): any {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const db = JSON.parse(raw);
      const defaults: Record<string, any> = {
        users: [], tasks: [], withdrawals: [], referrals: [], transactions: [],
        notifications: [], offerwalls: [], promoCodes: [], taskCompletions: [], deletedIds: []
      };
      return { ...defaults, ...db };
    }
  } catch (e) {
    logger.error({ err: e }, "DB read error");
  }
  return {
    users: [], tasks: [], withdrawals: [], referrals: [], transactions: [],
    notifications: [], offerwalls: [], promoCodes: [], taskCompletions: [], deletedIds: []
  };
}

export function writeDatabase(db: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
}

router.get("/db/get", (req, res) => {
  try {
    const db = getOrCreateDatabase();

    if (Array.isArray(db.deletedIds)) {
      const deletedSet = new Set<string>();
      db.deletedIds.forEach((item: any) => {
        if (!item) return;
        const id = typeof item === "string" ? item : (item.id || item.docId);
        if (id) deletedSet.add(String(id).trim());
      });
      if (deletedSet.size > 0) {
        const listKeys = ["tasks", "withdrawals", "referrals", "transactions", "notifications", "offerwalls", "promoCodes", "taskCompletions"];
        listKeys.forEach((key) => {
          if (Array.isArray(db[key])) {
            db[key] = db[key].filter((item: any) => item && item.id && !deletedSet.has(String(item.id).trim()));
          }
        });
      }
    }

    db.isFirestoreQuotaExceededServer = false;
    return res.json(db);
  } catch (error: any) {
    logger.error({ err: error }, "GET /db/get error");
    return res.status(500).json({ error: error.message });
  }
});

router.get("/db/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  sseClients.add(res);
  res.write(`event: connected\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`);

  const keepAlive = setInterval(() => {
    try {
      res.write(": ping\n\n");
    } catch {
      clearInterval(keepAlive);
    }
  }, 30000);

  req.on("close", () => {
    clearInterval(keepAlive);
    sseClients.delete(res);
  });
});

router.post("/db/save", (req, res) => {
  try {
    const payload = req.body;
    const db = getOrCreateDatabase();
    const isAdmin = req.headers["x-admin-auth"] === "true";

    if (Array.isArray(payload.users)) {
      payload.users.forEach((item: any) => {
        if (!item?.uid) return;
        const idx = db.users.findIndex((x: any) => x.uid === item.uid);
        if (idx !== -1) db.users[idx] = { ...db.users[idx], ...item };
        else db.users.push(item);
      });
    }

    const listKeys = ["tasks", "withdrawals", "referrals", "transactions", "notifications", "offerwalls", "promoCodes", "taskCompletions"];
    const deletedSet = new Set<string>();
    if (Array.isArray(db.deletedIds)) {
      db.deletedIds.forEach((item: any) => {
        if (!item) return;
        const id = typeof item === "string" ? item : (item.id || item.docId);
        if (id) deletedSet.add(String(id).trim());
      });
    }

    listKeys.forEach((key) => {
      if (!Array.isArray(payload[key])) return;
      payload[key].forEach((item: any) => {
        if (!item?.id) return;
        if (deletedSet.has(String(item.id).trim())) return;
        const idx = db[key].findIndex((x: any) => x.id === item.id);
        if (idx !== -1) {
          const existing = db[key][idx];
          let merged = { ...existing, ...item };
          if (key === "withdrawals" && !isAdmin) {
            if ((existing.status === "approved" || existing.status === "rejected") && item.status === "pending") merged.status = existing.status;
            if (existing.status === "pending" && (item.status === "approved" || item.status === "rejected")) merged.status = "pending";
          }
          if (key === "taskCompletions" && !isAdmin) {
            if ((existing.status === "completed" || existing.status === "rejected") && item.status === "pending") merged.status = existing.status;
            if (existing.status === "pending" && (item.status === "completed" || item.status === "rejected")) merged.status = "pending";
          }
          db[key][idx] = merged;
        } else {
          if (key === "withdrawals" && !isAdmin) item.status = "pending";
          db[key].push(item);
        }
      });
    });

    if (payload.settings) db.settings = { ...(db.settings || {}), ...payload.settings };
    if (payload.adConfig) db.adConfig = { ...(db.adConfig || {}), ...payload.adConfig };

    writeDatabase(db);
    notifyClients("database_updated", { timestamp: Date.now() });
    return res.json({ success: true, db });
  } catch (error: any) {
    logger.error({ err: error }, "POST /db/save error");
    return res.status(500).json({ error: error.message });
  }
});

router.post("/db/delete", (req, res) => {
  try {
    const { tableName, docId } = req.body;
    if (!tableName || !docId) return res.status(400).json({ error: "Missing tableName or docId" });

    const db = getOrCreateDatabase();
    const keyField = tableName === "users" ? "uid" : "id";

    if (!Array.isArray(db.deletedIds)) db.deletedIds = [];
    const docIdClean = String(docId).trim();
    const alreadyHas = db.deletedIds.some((item: any) => {
      const id = typeof item === "string" ? item : (item?.id || item?.docId);
      return id === docIdClean;
    });
    if (!alreadyHas) {
      db.deletedIds.push({ id: docIdClean, docId: docIdClean, tableName, deletedAt: new Date().toISOString() });
    }

    if (Array.isArray(db[tableName])) {
      db[tableName] = db[tableName].filter((x: any) => String(x[keyField]).trim() !== docIdClean);
    } else {
      return res.status(400).json({ error: `Table ${tableName} is not an array or does not exist.` });
    }

    writeDatabase(db);
    notifyClients("database_updated", { timestamp: Date.now() });
    return res.json({ success: true, deleted: true });
  } catch (error: any) {
    logger.error({ err: error }, "POST /db/delete error");
    return res.status(500).json({ error: error.message });
  }
});

router.post("/db/report-quota", (_req, res) => {
  return res.json({ success: true, message: "No Firebase configured — quota reporting is a no-op." });
});

router.get("/db/export", (req, res) => {
  try {
    const db = getOrCreateDatabase();
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", "attachment; filename=earnos_campaignpanel_backup.json");
    return res.send(JSON.stringify(db, null, 2));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/db/import", (req, res) => {
  try {
    const backup = req.body;
    if (!backup || typeof backup !== "object") return res.status(400).json({ error: "Invalid backup data format." });

    const tableKeys = ["users", "tasks", "withdrawals", "referrals", "transactions", "notifications", "offerwalls", "promoCodes", "taskCompletions"];
    let isValid = true;
    tableKeys.forEach((k) => {
      if (backup[k] && !Array.isArray(backup[k])) isValid = false;
    });
    if (!isValid) return res.status(400).json({ error: "Backup validation failed. Essential data arrays are missing or malformed." });

    const restoredDb: any = {};
    tableKeys.forEach((k) => { restoredDb[k] = Array.isArray(backup[k]) ? backup[k] : []; });
    restoredDb.settings = backup.settings || null;
    restoredDb.adConfig = backup.adConfig || null;

    writeDatabase(restoredDb);
    notifyClients("database_updated", { timestamp: Date.now() });
    return res.json({ success: true, message: "Database backup successfully restored!" });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/redirect", (req, res) => {
  try {
    const { task_id, user_id } = req.query;
    if (!task_id) return res.status(400).send("Error: Missing task_id query parameter.");

    const db = getOrCreateDatabase();
    const taskObj = db.tasks.find((t: any) => t.id === task_id);
    if (!taskObj?.url) return res.status(404).send("Error: Task not found or has no redirection URL.");

    let finalUrl = taskObj.url;
    const uid = user_id ? String(user_id).trim() : "";
    if (uid) {
      const replacements: [RegExp, string][] = [
        [/\{user_id\}/gi, uid], [/\[user_id\]/gi, uid],
        [/\{userid\}/gi, uid], [/\[userid\]/gi, uid],
        [/\{uid\}/gi, uid], [/\[uid\]/gi, uid],
        [/\{subid\}/gi, uid], [/\[subid\]/gi, uid],
        [/\{click_id\}/gi, uid], [/\[click_id\]/gi, uid],
        [/\{sub_id\}/gi, uid], [/\[sub_id\]/gi, uid],
        [/\{task_id\}/gi, taskObj.id], [/\[task_id\]/gi, taskObj.id],
      ];
      replacements.forEach(([pattern, replacement]) => {
        finalUrl = finalUrl.replace(pattern, replacement);
      });
    }

    logger.info({ taskId: task_id, uid }, "Redirecting user to task URL");
    return res.redirect(finalUrl);
  } catch (error: any) {
    return res.status(500).send(`Redirect failed: ${error.message}`);
  }
});

export default router;
