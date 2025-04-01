import mongoose from "mongoose";

const { Schema } = mongoose;

const deviceSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    relayState: {
      type: Boolean,
    },
    operationDuration: {
      type: String,
      enum: ["10min", "30min", "1hr"],
    },
    location: {
      type: String,
    },
    isConnected: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Device = mongoose.model("Device", deviceSchema);

export default Device;
