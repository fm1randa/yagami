import { Mongoose } from "mongoose";
import { logger } from "../helpers";
import { MongoStore } from "wwebjs-mongo";
import mongooseState from "./collections/mongooseState";

export async function connectToDatabase(mongoURI: string, mongoose: Mongoose) {
  try {
    mongooseState.mongoose = mongoose;
    logger.info("Connecting to MongoDB...");
    await mongoose.connect(mongoURI);
    logger.info("Connected to MongoDB");
    const store = new MongoStore({ mongoose });
    return {
      store,
    };
  } catch (error) {
    logger.error(`An error occurred while connecting to MongoDB: ${error}`);
  }
}
