import express from "express";
import {
  getAllUsers,
  editUser,
  getUser,
  deleteUser,
  createUser,
} from "../controllers/user.controller.js";
import { isAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", isAdmin, createUser);

router.get("/", isAdmin, getAllUsers);

router.patch("/:id", isAdmin, editUser);

router.get("/:id", isAdmin, getUser);

router.delete("/:id", isAdmin, deleteUser);

export default router;
