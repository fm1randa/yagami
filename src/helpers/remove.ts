import fs from "fs";
import { logger } from ".";

function remove(
	filePath: string,
	callback?: (err: NodeJS.ErrnoException) => void
) {
	const options = {
		recursive: true,
		force: true,
	};
	fs.rm(filePath, options, (error) => {
		if (callback) callback(error);
		if (error)
			return logger.error(`Erro ao deletar arquivo (${filePath}): ${error}`);
		logger.info(`Arquivo ou pasta deletado com sucesso! (${filePath})`);
	});
}

export default remove;
