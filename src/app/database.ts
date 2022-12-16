import { Mongoose } from "mongoose";
import { logger } from "../helpers";
import globalStates from "../globalStates";
import UserCollection from "./collections/User";
import GroupCollection from "./collections/Group";
import AudioCommandCollection from "./collections/AudioCommand";

export async function connectToDatabase(mongoURI: string, mongoose: Mongoose) {
  try {
    globalStates.mongoose = mongoose;
    const userCollection = new UserCollection(mongoose);
    const groupCollection = new GroupCollection(mongoose);
    const audioCommandCollection = new AudioCommandCollection(mongoose);
    globalStates.userCollection = userCollection;
    globalStates.groupCollection = groupCollection;
    globalStates.audioCommandCollection = audioCommandCollection;

    logger.info("Connecting to MongoDB...");
    await mongoose.connect(mongoURI);
    logger.info("Connected to MongoDB");
  } catch (error) {
    logger.error(`An error occurred while connecting to MongoDB: ${error}`);
  }
}
