import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: any = Router();

router.get("/healthz", (_req: any, res: any) => {
  const data = (HealthCheckResponse as any).parse({ status: "ok" });
  res.json(data);
});

export default router;
