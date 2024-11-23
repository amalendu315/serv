import express from "express";
import { getAkasaData } from "../controllers/airline_retrievers/akasa";

const router = express.Router();

//@ts-ignore
router.post("/", getAkasaData);

export default router;
