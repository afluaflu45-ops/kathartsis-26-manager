import { Router, type IRouter } from "express";
import healthRouter from "./health";
import financeRouter from "./finance";
import receiptsRouter from "./receipts";
import stickersRouter from "./stickers";
import certificatesRouter from "./certificates";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/finance", financeRouter);
router.use("/receipts", receiptsRouter);
router.use("/stickers", stickersRouter);
router.use("/certificates", certificatesRouter);

export default router;
