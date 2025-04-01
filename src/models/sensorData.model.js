import mongoose from "mongoose";

const { Schema } = mongoose;

const sensorDataSchema = new Schema(
  {
    device: {
      type: Schema.Types.ObjectId,
      ref: "Device",
      required: true,
    },
    temperature: {
      type: Number,
    },
    humidity: {
      type: Number,
    },
    tvoc: {
      type: Number,
    },
    airQualityStatus: {
      type: String,
      enum: ["Good", "Fair", "Bad"],
    },
  },
  { timestamps: true }
);

const SensorData = mongoose.model("SensorData", sensorDataSchema);

export default SensorData;
