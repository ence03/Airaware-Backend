import Average from "../models/average.model.js";
import SensorData from "../models/sensorData.model.js";
import Device from "../models/device.model.js";

export const calculateAndSaveHourlyAverage = async (req, res) => {
  const { deviceId } = req.params; // Get the deviceId from the route params
  try {
    const currentTime = new Date();
    console.log(`Function executed at: ${currentTime.toISOString()}`);

    // Get sensor data for the last hour for the specific device
    const pastHourData = await SensorData.find({
      device: deviceId, // Filter by deviceId
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
    });

    if (pastHourData.length === 0) {
      console.log("[Warning] No data available for the past hour");
      return res.status(404).json({ success: false, message: "No data found" });
    }

    // Calculate averages
    const avgTemperature =
      pastHourData.reduce((sum, data) => sum + data.temperature, 0) /
      pastHourData.length;
    const avgHumidity =
      pastHourData.reduce((sum, data) => sum + data.humidity, 0) /
      pastHourData.length;
    const avgTVOC =
      pastHourData.reduce((sum, data) => sum + data.tvoc, 0) /
      pastHourData.length;

    // Determine air quality status
    const airQualityStatus =
      avgTemperature > 30 ? "Bad" : avgHumidity > 60 ? "Fair" : "Good";

    // Save the average for the specific device
    const newAverage = new Average({
      deviceId, // Use the provided deviceId
      type: "hourly",
      avgTemperature,
      avgHumidity,
      avgTVOC,
      airQualityStatus,
    });

    await newAverage.save();

    // Emit the new average data to clients
    req.io.emit("newAvgData", newAverage);

    console.log("[Success] Hourly average calculated and stored successfully");
    res.status(200).json({ success: true, data: newAverage });
  } catch (error) {
    console.error("[Error] Failed to calculate hourly average:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const calculateAndSaveDailyAverage = async (req, res) => {
  const { deviceId } = req.params; // Get the deviceId from the route params
  try {
    const currentTime = new Date();
    console.log(`Function executed at: ${currentTime.toISOString()}`);

    // Get sensor data for the last 24 hours for the specific device
    const pastDayData = await SensorData.find({
      device: deviceId, // Filter by deviceId
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
    });

    if (pastDayData.length === 0) {
      console.log("No data available for the past 24 hours");
      return res.status(404).json({ success: false, message: "No data found" });
    }

    // Calculate averages
    const avgTemperature =
      pastDayData.reduce((sum, data) => sum + data.temperature, 0) /
      pastDayData.length;
    const avgHumidity =
      pastDayData.reduce((sum, data) => sum + data.humidity, 0) /
      pastDayData.length;
    const avgTVOC =
      pastDayData.reduce((sum, data) => sum + data.tvoc, 0) /
      pastDayData.length;

    // Determine air quality status
    const airQualityStatus =
      avgTemperature > 30 ? "Bad" : avgHumidity > 60 ? "Fair" : "Good";

    // Save the daily average for the specific device
    const newAverage = new Average({
      deviceId, // Use the provided deviceId
      type: "daily",
      avgTemperature,
      avgHumidity,
      avgTVOC,
      airQualityStatus,
    });

    await newAverage.save();

    // Emit the new daily average data to clients
    req.io.emit("newAvgData", newAverage);

    console.log("Daily average calculated and stored successfully");
    res.status(200).json({ success: true, data: newAverage });
  } catch (error) {
    console.error("Error calculating daily average:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAverage = async (req, res) => {
  const { type, avgTemperature, avgHumidity, avgTVOC, airQualityStatus } =
    req.body;

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

    const newAverage = new Average({
      deviceId: connectedDevice._id,
      type,
      avgTemperature,
      avgHumidity,
      avgTVOC,
      airQualityStatus,
    });

    await newAverage.save();

    req.io.emit("newAvgData", newAverage);

    return res.status(201).json({
      success: true,
      message: "Average Stored",
      data: newAverage,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to store average",
      error,
    });
  }
};

export const getAllAverage = async (req, res) => {
  const { type } = req.query;

  try {
    const userId = req.user.id; // Get the authenticated user's ID
    console.log("Authenticated User ID:", req.user.id);

    // Find the connected device for the authenticated user
    const connectedDevice = await Device.findOne({
      user: userId,
      isConnected: true,
    });

    if (!connectedDevice) {
      return res.status(400).json({
        success: false,
        message: "No connected device found for the current user.",
      });
    }

    let query = { deviceId: connectedDevice._id };

    if (type) {
      query.type = type;
    }

    // Fetch the averages for the connected device
    const averages = await Average.find(query)
    .populate("deviceId", "name");

    if (!averages || averages.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No averages found for the connected device",
      });
    }

    return res.status(200).json({
      success: true,
      data: averages,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve averages",
      error,
    });
  }
};

setInterval(calculateAndSaveHourlyAverage, 60 * 60 * 1000);
setInterval(calculateAndSaveDailyAverage, 24 * 60 * 60 * 1000);
