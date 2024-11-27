import express from "express";
import { getSpicejetStatus } from "../../controllers/flightops/spicejet";
import upload from "../../multer/upload";

const router = express.Router();

//@ts-ignore
router.post("/", upload,getSpicejetStatus);

export default router;
