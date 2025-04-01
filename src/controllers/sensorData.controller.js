import SensorData from "../models/sensorData.model.js";
import Device from "../models/device.model.js";

export const postSensorData = async (req, res) => {
  const { temperature, humidity, tvoc, airQualityStatus } = req.body;

  try {
    const userId = req.user.id;
    console.log("Authenticated User ID:", req.user.id);
    const connectedDevice = await Device.findOne({
      user: userId,
      isConnected: true,
    });
    console.log("Connected Device:", connectedDevice);

    if (!connectedDevice) {
      return res.status(400).json({
        success: false,
        message: "No connected device found for the current user.",
      });
    }

    const newData = new SensorData({
      device: connectedDevice._id,
      temperature,
      humidity,
      tvoc,
      airQualityStatus,
    });

    // Save the sensor data
    await newData.save();

    // Emit the new data to clients via WebSocket
    req.io.emit("newSensorData", newData);

    return res.status(201).json({
      success: true,
      message: "Sensor data saved successfully",
      data: newData,
    });
  } catch (error) {
    console.error("Error saving sensor data:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getAllSensorData = async (req, res) => {
  try {
    const data = await SensorData.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error fetching all sensor data:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getLatestSensorData = async (req, res) => {
  try {
    const userId = req.user.id;

    const connectedDevice = await Device.findOne({
      user: userId,
      isConnected: true,
    });

    if (!connectedDevice) {
      return res
        .status(400)
        .json({ success: false, message: "No connected device found." });
    }

    const latestData = await SensorData.findOne({
      device: connectedDevice._id, // Use the device ID directly
    }).sort({ createdAt: -1 });

    if (!latestData) {
      return res.status(404).json({
        success: false,
        message: "No data found for the connected device.",
      });
    }

    res.status(200).json({ success: true, data: latestData });
  } catch (error) {
    console.error("Error fetching latest sensor data:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
