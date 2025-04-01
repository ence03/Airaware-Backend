import mongoose from "mongoose";

const { Schema } = mongoose;

const averageSchema = new Schema(
  {
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: "Device",
    },
    type: {
      type: String,
      enum: ["hourly", "daily"],
    },
    avgTemperature: {
      type: Number,
    },
    avgHumidity: {
      type: Number,
    },
    avgTVOC: {
      type: Number,
    },
    airQualityStatus: {
      type: String,
      enum: ["Good", "Fair", "Bad"],
    },
  },
  { timestamps: true }
);

const Average = mongoose.model("Average", averageSchema);

export default Average;
