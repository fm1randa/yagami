import fs from 'fs'
import { logger } from '.'

function remove (
  filePath: string,
  callback?: (err: NodeJS.ErrnoException) => void
) {
  const options = {
    recursive: true,
    force: true
  }
  fs.rm(filePath, options, (error) => {
    if (callback) callback(error)
    if (error) { return logger.error(`Error while deleting file (${filePath}): ${error}`) }
    logger.info(`File or folder deleted successfully! (${filePath})`)
  })
}

export default remove
