import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import dbRouter from "./db.js";
import postbackRouter from "./postback.js";
import uploadRouter from "./upload.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dbRouter);
router.use(postbackRouter);
router.use(uploadRouter);

export default router;
