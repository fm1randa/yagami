import mongoose from "mongoose";
import dotenv, { DotenvConfigOptions } from "dotenv";
import { format, FormatInputPathObject } from "path";
import { logger } from "../helpers";
import { MongoStore } from "wwebjs-mongo";

export async function connectToDatabase(mongoURI: string) {
	try {
		const path: FormatInputPathObject = {
			base: ".env",
		};
		const options: DotenvConfigOptions = {
			path: format(path),
		};
		dotenv.config(options);
		logger.info("Connecting to MongoDB...");
		await mongoose.connect(mongoURI);
		logger.info("Connected to MongoDB");
		const store = new MongoStore({ mongoose });
		return {
			mongoose,
			store,
		};
	} catch (error) {
		logger.error(`An error occurred while connecting to MongoDB: ${error}`);
	}
}
