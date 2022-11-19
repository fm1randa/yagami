import mongoose from "mongoose";
import dotenv, { DotenvConfigOptions } from "dotenv";
import { format, FormatInputPathObject } from "path";
import { logger } from "../helpers";

export async function connectToDatabase() {
	const path: FormatInputPathObject = {
		base: ".env",
	};
	const options: DotenvConfigOptions = {
		path: format(path),
	};
	dotenv.config(options);
	logger.info("Conectando ao MongoDB...");
	return mongoose.connect(process.env.MONGO_URI);
}
