import type YagamiClient from '../YagamiClient'
import { type Message, type Reaction } from 'whatsapp-web.js'
import groupActionSet from '../actionSets/GroupActionSet'
import userActionSet from '../actionSets/UserActionSet'
import type User from '../app/models/User'
import type UserCollection from '../app/collections/User'
import type GroupCollection from '../app/collections/Group'
import { getMsUntilNow } from '.'
import logger from './logger'
import { type MessageProps, type TriggerType } from '../Command'
import mongooseState from '../globalStates'
import UserActionSet from '../actionSets/UserActionSet'
import GroupActionSet from '../actionSets/GroupActionSet'

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
  private readonly userCollection: UserCollection
  private readonly groupCollection: GroupCollection
  private readonly userActionSet: UserActionSet
  private readonly groupActionSet: GroupActionSet
  constructor () {
    const { userCollection, groupCollection } = mongooseState
    this.userCollection = userCollection
    this.groupCollection = groupCollection
    this.userActionSet = new UserActionSet()
    this.groupActionSet = new GroupActionSet()
  }

  async cleanupGroup (message: Message, client: YagamiClient) {
    const contact = await client.getContactById(message.from)
    const chat = await contact.getChat()
    if (!chat || !chat.isGroup) return
    const group = await this.groupCollection.getById(chat.id._serialized)
    if (!group) return
    if (
      !group.lastCleanup ||
      getMsUntilNow(group.lastCleanup) > 6 * 60 * 60 * 1000
    ) {
      chat.clearMessages()
      group.lastCleanup = new Date()
      group.save()
    }
  }

  handleSignups (message: Message, client: YagamiClient) {
    this.userActionSet.addUser(message)
    this.groupActionSet.addGroup(message, client)
  }

  static isUselessMessage (message: Message) {
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

  static async matches (matchesOptions: MatchesOptionsType) {
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
          const { checkRule, text } = messageProps[prop]
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
          if (Array.isArray(messageProps[prop])) {
            return messageProps[prop].includes(message.type)
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
      }
    }

    const chat = await message.getChat()
    const fromGroup = chat.isGroup
    const matchArray: boolean[] = []
    if (trigger.inAnyChat) {
      matchArray.push(match(trigger.inAnyChat))
    }
    if (trigger.inGroup && fromGroup) {
      matchArray.push(match(trigger.inGroup))
    }
    if (trigger.inPrivateChat && !fromGroup) {
      matchArray.push(match(trigger.inPrivateChat))
    }
    matchArray.push(checkMainText())
    return matchArray.some((match) => match)
  }

  static async isAdmin (user: User) {
    return user && user.isAdmin
  }

  async getUserFromMessage (message: Message) {
    const contact = await message.getContact()
    return await this.userCollection.getById(contact.id._serialized)
  }

  async hasUserPermission (message: Message, restricted: boolean) {
    const user = await this.getUserFromMessage(message)
    const fromAdmin = await ClientHelpers.isAdmin(user)
    if (restricted && !fromAdmin) {
      return false
    }
    return true
  }

  async checkPermissions ({
    message,
    restricted
  }: {
    message: Message
    restricted: boolean
    client: YagamiClient
  }): Promise<ChatPermissions> {
    const userHasPermission = await this.hasUserPermission(message, restricted)
    const chatPermissions: ChatPermissions = {
      userHasPermission
    }
    return chatPermissions
  }

  // unused but can be useful
  static async getReplies (message: Message) {
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

  static async getReactionMessage (reaction: Reaction, client: YagamiClient) {
    try {
      const chat = await client.getChatById(reaction.id.remote)
      const recentMessages = await chat.fetchMessages({ limit: 10 })
      const message = recentMessages.find(
        (msg) => msg.id.id === reaction.msgId.id
      )
      if (!message) {
        throw new Error('Message not found')
      }
      return message
    } catch (error) {
      throw new Error(error)
    }
  }

  static async didMessageMentionMe (message: Message, client: YagamiClient) {
    const mentions = await message.getMentions()
    const me = client.info.wid
    if (!mentions || (mentions.length === 0)) return false
    if (!me) return false
    return mentions.some(
      (mention) => mention.id._serialized === me._serialized
    )
  }

  static async getThread (
    message: Message,
    limit: number = 10
  ): Promise<Message[]> {
    const thread: Message[] = []
    let currentMessage: Message = message
    for (let i = 0; i < limit; i++) {
      const quotedMessage = await currentMessage.getQuotedMessage()
      if (!quotedMessage) break
      thread.push(quotedMessage)
      currentMessage = quotedMessage
    }
    return thread
  }
}
