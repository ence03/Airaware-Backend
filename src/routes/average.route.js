import express from "express";
import {
  createAverage,
  getAllAverage,
} from "../controllers/average.controller.js";
import { authenticate } from "../middlewares/authenticate.js";

const router = express.Router();

router.post("/", authenticate, createAverage);

router.get("/", authenticate, getAllAverage);

export default router;
