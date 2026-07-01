import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dbRouter from "./db";
import postbackRouter from "./postback";
import uploadRouter from "./upload";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dbRouter);
router.use(postbackRouter);
router.use(uploadRouter);

export default router;
