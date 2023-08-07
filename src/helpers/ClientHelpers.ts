import type YagamiClient from '../YagamiClient'
import { type Message, type Reaction } from 'whatsapp-web.js'
import type User from '../app/models/User'
import { getMsUntilNow } from '.'
import logger from './logger'
import { type MessageProps, type TriggerType } from '../Command'
import mongooseState from '../globalStates'
import { addUser } from '../actionSets/UserActionSet'
import { addGroup } from '../actionSets/GroupActionSet'

interface MatchesOptionsType {
  message: Message
  trigger: TriggerType
  client: YagamiClient
}
interface ChatPermissions {
  userHasPermission: boolean
}
interface MessageBodyObject {
  mimetype: string
  data: string
}
type MessageBody = string | MessageBodyObject

export default class ClientHelpers {
  client: YagamiClient

  constructor (client: YagamiClient) {
    this.client = client
  }

  cleanupGroup = async (message: Message) => {
    const { groupCollection } = mongooseState
    if (groupCollection === undefined) {
      logger.warn('Attempted to cleanup group but groupCollection is undefined')
      return
    }
    const contact = await this.client.getContactById(message.from)
    const chat = await contact.getChat()
    if (!chat?.isGroup) return
    const group = await groupCollection.getById(chat.id._serialized)
    if (group === null) return
    if (
      group.lastCleanup === null ||
      getMsUntilNow(group.lastCleanup) > 6 * 60 * 60 * 1000
    ) {
      chat.clearMessages()
      group.lastCleanup = new Date()
      group.save()
    }
  }

  handleSignups = async (message: Message) => {
    const { userCollection, groupCollection } = mongooseState
    if (userCollection === undefined) {
      logger.warn('Attempted to handle signups but userCollection is undefined')
      return
    }
    if (groupCollection === undefined) {
      logger.warn('Attempted to handle signups but groupCollection is undefined')
      return
    }
    await Promise.all([
      addUser(message),
      addGroup(message, this.client)
    ])
  }

  static isUselessMessage = (message: Message) => {
    const checkMessageBody = (body: MessageBody) => {
      if (typeof body === 'string') {
        return message.body.includes('🤖')
      }
      return true
    }
    return (
      message.type === 'sticker' ||
      message.type === 'audio' ||
      message.type === 'ptt' ||
      checkMessageBody(message.body)
    )
  }

  static matches = async (matchesOptions: MatchesOptionsType) => {
    const { message, trigger, client } = matchesOptions
    const match = (messageProps: MessageProps | MessageProps[]): boolean => {
      if (Array.isArray(messageProps)) {
        return messageProps.some((messageProp) =>
          checkMessageProps(messageProp)
        )
      }
      return checkMessageProps(messageProps)
    }

    const checkMessageProps = (messageProps: MessageProps): boolean => {
      const props = Object.keys(messageProps)
      return props.every((prop) => {
        if (prop === 'body') {
          const bodyCheckProps = messageProps[prop]
          if (bodyCheckProps === undefined) return true

          const { checkRule, text } = bodyCheckProps
          const checker = client.getChecker(checkRule)
          if (typeof message.body !== 'string') {
            return false
          }
          if (Array.isArray(text)) {
            return text.some((text) => checker(message.body, text))
          }
          return checker(message.body, text)
        }
        if (prop === 'type') {
          const messageTypes = messageProps[prop]
          if (messageTypes === undefined) return true

          if (Array.isArray(messageTypes)) {
            return messageTypes.includes(message.type)
          }
          return messageProps[prop] === message.type
        }
        if (prop === 'hasQuotedMsg') {
          return message.hasQuotedMsg === messageProps[prop]
        }
        return false
      })
    }

    const checkMainText = (): boolean => {
      try {
        const { mainCheckRule, mainText } = trigger
        const checker = client.getChecker(mainCheckRule)
        if (typeof message.body !== 'string') {
          return false
        }
        return checker(message.body, mainText)
      } catch (error) {
        logger.error('Error while checking main text: ', error)
        return false
      }
    }

    const chat = await message.getChat()
    const fromGroup = chat.isGroup
    const matchArray: boolean[] = []
    if (trigger.inAnyChat != null) {
      matchArray.push(match(trigger.inAnyChat))
    }
    if ((trigger.inGroup != null) && fromGroup) {
      matchArray.push(match(trigger.inGroup))
    }
    if ((trigger.inPrivateChat != null) && !fromGroup) {
      matchArray.push(match(trigger.inPrivateChat))
    }
    matchArray.push(checkMainText())
    return matchArray.some((match) => match)
  }

  static isAdmin = (user: User) => {
    return user?.isAdmin
  }

  static getUserFromMessage = async (message: Message) => {
    const { userCollection } = mongooseState
    if (userCollection === undefined) {
      logger.warn('Attempted to get user from message but userCollection is undefined')
      return null
    }
    const contact = await message.getContact()
    return await userCollection.getById(contact.id._serialized)
  }

  static hasUserPermission = async (message: Message, restricted: boolean) => {
    if (!restricted) {
      return true
    }
    const user = await ClientHelpers.getUserFromMessage(message)
    if (user === null) {
      message.reply('🐛 I could not find info about you and that is why I can not run this command right now.')
      logger.warn('Attempted to get user permission but user is null. Command WON\'T be executed.')
      return false
    }
    const fromAdmin = ClientHelpers.isAdmin(user)
    if (!fromAdmin) {
      logger.warn('A non-admin user tried to execute a restricted command. Command WON\'T be executed.')
      return false
    }
    return true
  }

  static checkPermissions = async ({
    message,
    restricted
  }: {
    message: Message
    restricted: boolean
  }): Promise<ChatPermissions> => {
    const userHasPermission = await ClientHelpers.hasUserPermission(message, restricted)
    const chatPermissions: ChatPermissions = {
      userHasPermission
    }
    return chatPermissions
  }

  static getReplies = async (message: Message) => {
    const chat = await message.getChat()
    const messages = await chat.fetchMessages({ limit: 100, fromMe: true })
    const msgsWithQuotedMsg = messages.filter(
      (message) => message.hasQuotedMsg
    )
    const msgWithQuotedMsgInstances = await Promise.all(
      msgsWithQuotedMsg.map(async (message) =>
        await message.getQuotedMessage().then((quotedMsg) => ({ message, quotedMsg }))
      )
    )
    const msgsWithThisMessageQuoted = msgWithQuotedMsgInstances.filter(
      (msgWithQuotedMsgInstance) =>
        msgWithQuotedMsgInstance.quotedMsg.body === message.body
    )
    const replies = msgsWithThisMessageQuoted.map(
      (msgWithThisMessageQuoted) => msgWithThisMessageQuoted.message
    )
    return replies
  }

  getReactionMessage = async (reaction: Reaction) => {
    try {
      const chat = await this.client.getChatById(reaction.id.remote)
      const recentMessages = await chat.fetchMessages({ limit: 10 })
      const message = recentMessages.find(
        (msg) => msg.id.id === reaction.msgId.id
      )
      if (message == null) {
        throw new Error('Message not found')
      }
      return message
    } catch (error) {
      throw new Error(error)
    }
  }

  didMessageMentionMe = async (message: Message) => {
    const mentions = await message.getMentions()
    const me = this.client.info.wid
    if (mentions === undefined || (mentions.length === 0)) return false
    if (me === undefined) return false
    return mentions.some(
      (mention) => mention.id._serialized === me._serialized
    )
  }

  static getThread = async (
    message: Message,
    limit: number = 10
  ): Promise<Message[]> => {
    const thread: Message[] = []
    let currentMessage: Message = message
    for (let i = 0; i < limit; i++) {
      const quotedMessage = await currentMessage.getQuotedMessage()
      if (quotedMessage === undefined) break
      thread.push(quotedMessage)
      currentMessage = quotedMessage
    }
    return thread
  }
}
