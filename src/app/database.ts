import { Mongoose } from "mongoose";
import { logger } from "../helpers";
import { MongoStore } from "wwebjs-mongo";
import mongooseState from "../globalStates";
import UserCollection from "./collections/User";
import GroupCollection from "./collections/Group";

export async function connectToDatabase(mongoURI: string, mongoose: Mongoose) {
  try {
    mongooseState.mongoose = mongoose;
    const userCollection = new UserCollection(mongoose);
    const groupCollection = new GroupCollection(mongoose);
    mongooseState.userCollection = userCollection;
    mongooseState.groupCollection = groupCollection;

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
