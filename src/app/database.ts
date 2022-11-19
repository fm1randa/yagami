import mongoose from "mongoose";
import dotenv, { DotenvConfigOptions } from "dotenv";
import { format, FormatInputPathObject } from "path";
import { logger } from "../helpers";

export async function connectToDatabase(mongoURI: string) {
	const path: FormatInputPathObject = {
		base: ".env",
	};
	const options: DotenvConfigOptions = {
		path: format(path),
	};
	dotenv.config(options);
	logger.info("Connecting to MongoDB...");
	return mongoose.connect(mongoURI);
}
