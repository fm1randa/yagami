import { createLogger, format, transports } from 'winston'
const { timestamp, errors, splat, json, printf, combine, colorize } = format

const myFormat = printf(({ level, timestamp, message, ...rest }) => {
  return `[${timestamp}] ${level}: ${message}\n${
        (Object.keys(rest).length > 0) ? JSON.stringify(rest, null, 2) : ''
    }`
})

const defaultFormat = combine(
  timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  errors({ stack: true }),
  splat(),
  json(),
  myFormat
)

const logger = createLogger({
  format: defaultFormat,
  transports: [
    new transports.File({
      filename: 'error.log',
      level: 'error',
      dirname: 'logs'
    }),
    new transports.File({
      filename: 'combined.log',
      dirname: 'logs'
    }),
    new transports.Console({
      format: combine(colorize(), defaultFormat)
    })
  ]
})

export default logger
