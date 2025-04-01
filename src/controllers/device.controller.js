import Device from "../models/device.model.js";
import mongoose from "mongoose";
import { esp32Socket } from "../../server.js";

export const createDevice = async (req, res) => {
  try {
    // Retrieve user ID from the authenticated request (JWT or session)
    const userId = req.user.id; 
    console.log("User ID from token:", userId);

    const { name, relayState, operationDuration, location } = req.body;

    console.log("Received device data:", req.body);

    // Check if the user ID is available (from the authenticated user)
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User not authenticated" });
    }

    await Device.updateMany({ user: userId }, { isConnected: false });
    // Create a new device and automatically associate it with the user ID
    const device = new Device({
      name,
      user: userId, // Automatically assign the user ID here
      relayState,
      operationDuration,
      location,
      isConnected: true,
    });

    await device.save();

    return res
      .status(201)
      .json({ success: true, message: "Device added", data: device });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getDevices = async (req, res) => {
  try {
    const userId = req.user.id; // Extract user ID from the token

    if (req.user.role === "admin") {
      // Admin can view all devices
      const devices = await Device.find().populate("user", "username email");
      return res.status(200).json({ success: true, data: devices });
    }

    // Regular users can only view their own devices
    const devices = await Device.find({ user: userId }).populate(
      "user",
      "username email"
    );
    return res.status(200).json({ success: true, data: devices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDeviceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Id format, try again",
      });
    }

    const device = await Device.findById({ _id: id }).populate(
      "user",
      "username email"
    );

    if (!device) {
      return res
        .status(404)
        .json({ success: false, message: "Device not found" });
    }

    res.status(200).json({ success: true, data: device });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    // If setting the device as connected, disconnect others
    if (updates.isConnected === true) {
      await Device.updateMany({ user: userId }, { isConnected: false });
    }

    // Find and update the specific device
    const updatedDevice = await Device.findOneAndUpdate(
      { _id: id, user: userId },
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedDevice) {
      return res.status(404).json({
        success: false,
        message: "Device not found or not authorized",
      });
    }

    req.io.emit("deviceUpdated", updatedDevice);

    if (esp32Socket && updates.relayState !== undefined) {
      const relayData = {
        relayState: updates.relayState,
        operationDuration: updates.operationDuration || "10min", // Default to "10min" if not provided
      };

      esp32Socket.send(JSON.stringify(relayData)); // Send as a JSON string
    }

    res.status(200).json({ success: true, data: updatedDevice });
  } catch (error) {
    console.error("Error updating device:", error); // For debugging
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const deleteDevice = async (req, res) => {
  try {
    const { id } = req.params;

    // Retrieve user ID from the authenticated request (JWT or session)
    const userId = req.user.id; // Make sure the user ID is decoded from the token

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User not authenticated" });
    }

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Id format, try again",
      });
    }

    // Find the device to be deleted
    const deviceToDelete = await Device.findById(id);

    if (!deviceToDelete || deviceToDelete.user.toString() !== userId) {
      return res.status(404).json({
        success: false,
        message: "Device not found or not authorized",
      });
    }

    // If the device being deleted is the one marked as "isConnected: true",
    // set another device to "isConnected: true" if available
    if (deviceToDelete.isConnected) {
      const nextDevice = await Device.findOne({
        user: userId,
        isConnected: false,
      });
      if (nextDevice) {
        await Device.updateOne({ _id: nextDevice._id }, { isConnected: true });
      }
    }

    // Proceed with deleting the device
    await Device.findByIdAndDelete(id);

    res
      .status(200)
      .json({ success: true, message: "Device deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const enableDisableDevice = async (req, res) => {
  try {
    const { id } = req.params; // The device ID passed in the URL
    const { isConnected } = req.body; // The state to enable or disable the device (true or false)

    // Check if the user is an admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Permission denied. Admin role required.",
      });
    }

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    // Find the device and update its connection status
    const updatedDevice = await Device.findByIdAndUpdate(
      { _id: id },
      { isConnected },
      { new: true, runValidators: true }
    );

    if (!updatedDevice) {
      return res.status(404).json({
        success: false,
        message: "Device not found",
      });
    }

    // Notify the front-end or clients about the update (optional)
    req.io.emit("deviceUpdated", updatedDevice);

    // Respond with the updated device
    res.status(200).json({
      success: true,
      message: isConnected
        ? "Device enabled successfully"
        : "Device disabled successfully",
      data: updatedDevice,
    });
  } catch (error) {
    console.error("Error updating device:", error); // For debugging
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
