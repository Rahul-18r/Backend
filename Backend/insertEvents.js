import mongoose from "mongoose";
import dotenv from "dotenv";
import Event from "./models/eventModel.js";
import fs from "fs";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("DB connection error:", error);
    process.exit(1);
  }
};

const insertEvents = async () => {
  try {
    await connectDB();
    const rawData = JSON.parse(fs.readFileSync("sambhram.events.json", "utf8"));
    const data = rawData.map((event) => ({
      ...event,
      _id: event._id.$oid,
    }));
    await Event.insertMany(data);
    console.log("Events inserted successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error inserting events:", error);
    process.exit(1);
  }
};

insertEvents();