import express from "express";
import { getSpiceJetData } from "../controllers/airline_retrievers/retrieve";

const router = express.Router();

router.post("/", getSpiceJetData);

export default router;
