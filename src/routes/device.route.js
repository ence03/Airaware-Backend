import express from "express";
import {
  createDevice,
  getDevices,
  getDeviceById,
  updateDevice,
  deleteDevice,
  enableDisableDevice,
} from "../controllers/device.controller.js";

const router = express.Router();

router.post("/", createDevice);

router.get("/", getDevices);

router.get("/:id", getDeviceById);

router.put("/:id", updateDevice);

router.delete("/:id", deleteDevice);

router.patch("/:id/enable-disable", enableDisableDevice);

export default router;
