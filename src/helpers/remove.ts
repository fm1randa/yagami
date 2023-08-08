import fs from 'fs';
import { logger } from '.';

function remove(
  filePath: string,
  callback?: (err: NodeJS.ErrnoException) => void
) {
  const options = {
    recursive: true,
    force: true
  };
  fs.rm(filePath, options, (error) => {
    if (error === null) {
      return;
    }
    if (callback != null) callback(error);
    if (error != null) {
      return logger.error(`Error while deleting file (${filePath}):`, error);
    }
    logger.info(`File or folder deleted successfully! (${filePath})`);
  });
}

export default remove;
