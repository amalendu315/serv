import express from "express";
import { getAkasaStatus } from "../../controllers/flightops/akasa";
import upload from "../../multer/upload";


const router = express.Router();

//@ts-ignore
router.post("/", upload,getAkasaStatus);

export default router;
