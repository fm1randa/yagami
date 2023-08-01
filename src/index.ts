import YagamiClient, { type YagamiOptions } from './YagamiClient'
import Command, {
  type CommandAction,
  type CheckRule,
  type BodyCheckProps,
  type CommandAttributes,
  type MessageProps,
  type TriggerType
} from './Command'
import { connectToDatabase } from './app/database'

export default YagamiClient
export {
  Command,
  type YagamiOptions,
  type CommandAction,
  type CheckRule,
  type BodyCheckProps,
  type CommandAttributes,
  type MessageProps,
  type TriggerType,
  connectToDatabase
}
