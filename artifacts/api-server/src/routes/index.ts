import { Router, type IRouter } from "express";
import healthRouter from "./health";
import financeRouter from "./finance";
import receiptsRouter from "./receipts";
import stickersRouter from "./stickers";
import certificatesRouter from "./certificates";
import uploadsRouter from "./uploads";
import sportsRouter from "./sports";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/finance", financeRouter);
router.use("/receipts", receiptsRouter);
router.use("/stickers", stickersRouter);
router.use("/certificates", certificatesRouter);
router.use("/uploads", uploadsRouter);
router.use("/sports", sportsRouter);

export default router;
