import express from 'express';
import { convertController } from '../controllers/convert';
import upload from '../multer/upload';

const router = express.Router();

//@ts-ignore
router.post('/',upload, convertController);

export default router;