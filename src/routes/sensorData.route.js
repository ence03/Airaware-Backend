import express from "express";
import {
  postSensorData,
  getAllSensorData,
  getLatestSensorData,
} from "../controllers/sensorData.controller.js";
import { authenticate } from "../middlewares/authenticate.js";

const router = express.Router();

router.post("/", authenticate, postSensorData);

router.get("/", getAllSensorData);

router.get("/latest", authenticate, getLatestSensorData);

export default router;