import YagamiClient from "../YagamiClient";
import { Message, Reaction } from "whatsapp-web.js";
import groups from "../actionSets/groups";
import users from "../actionSets/users";
import User from "../app/models/User";
import UserCollection from "../app/collections/User";
import GroupCollection from "../app/collections/Group";
import { getMsUntilNow } from ".";
import logger from "./logger";
import { MessageProps, TriggerType } from "../Command";

type MatchesOptionsType = {
  message: Message;
  trigger: TriggerType;
  client: YagamiClient;
};
type ChatPermissions = {
  userHasPermission: boolean;
};

export default class ClientHelpers {
  static async cleanupGroup(message: Message, client: YagamiClient) {
    const contact = await client.getContactById(message.from);
    const chat = await contact.getChat();
    if (!chat || !chat.isGroup) return;
    const group = await GroupCollection.getById(chat.id._serialized);
    if (!group) return;
    if (
      !group.lastCleanup ||
      getMsUntilNow(group.lastCleanup) > 6 * 60 * 60 * 1000
    ) {
      chat.clearMessages();
      group.lastCleanup = new Date();
      group.save();
    }
  }

  static handleSignups(message: Message, client: YagamiClient) {
    users.addUser(message);
    groups.addGroup(message, client);
  }

  static isUselessMessage(message: Message) {
    return (
      message.type === "sticker" ||
      message.type === "audio" ||
      message.type === "ptt" ||
      message.body.includes("🤖")
    );
  }

  static async matches(matchesOptions: MatchesOptionsType) {
    const { message, trigger, client } = matchesOptions;
    const match = (messageProps: MessageProps | MessageProps[]): boolean => {
      if (Array.isArray(messageProps)) {
        return messageProps.some((messageProp) =>
          checkMessageProps(messageProp)
        );
      }
      return checkMessageProps(messageProps);
    };

    const checkMessageProps = (messageProps: MessageProps): boolean => {
      const props = Object.keys(messageProps);
      return props.every((prop) => {
        if (prop === "body") {
          const { checkRule, text } = messageProps[prop];
          const checker = client.getChecker(checkRule);
          if (Array.isArray(text)) {
            return text.some((text) => checker(message.body, text));
          }
          return checker(message.body, text);
        }
        if (prop === "type") {
          if (Array.isArray(messageProps[prop])) {
            return messageProps[prop].includes(message.type);
          }
          return messageProps[prop] === message.type;
        }
        if (prop === "hasQuotedMsg") {
          return message.hasQuotedMsg === messageProps[prop];
        }
        return false;
      });
    };

    const checkMainText = (): boolean => {
      try {
        const { mainCheckRule, mainText } = trigger;
        const checker = client.getChecker(mainCheckRule);
        return checker(message.body, mainText);
      } catch (error) {
        logger.error("Error while checking main text: ", error);
      }
    };

    const chat = await message.getChat();
    const fromGroup = chat.isGroup;
    const matchArray: boolean[] = [];
    if (trigger.inAnyChat) {
      matchArray.push(match(trigger.inAnyChat));
    }
    if (trigger.inGroup && fromGroup) {
      matchArray.push(match(trigger.inGroup));
    }
    if (trigger.inPrivateChat && !fromGroup) {
      matchArray.push(match(trigger.inPrivateChat));
    }
    matchArray.push(checkMainText());
    return matchArray.some((match) => match);
  }

  static async isAdmin(user: User) {
    return user && user.isAdmin;
  }

  static async getUserFromMessage(message: Message) {
    const contact = await message.getContact();
    return UserCollection.getById(contact.id._serialized);
  }

  static async hasUserPermission(message: Message, restricted: boolean) {
    const user = await this.getUserFromMessage(message);
    const fromAdmin = await this.isAdmin(user);
    if (restricted && !fromAdmin) {
      return false;
    }
    return true;
  }

  static async checkPermissions({
    message,
    restricted,
  }: {
    message: Message;
    restricted: boolean;
    client: YagamiClient;
  }): Promise<ChatPermissions> {
    const chatPermissions: ChatPermissions = {
      userHasPermission: await this.hasUserPermission(message, restricted),
    };
    return chatPermissions;
  }
  // unused but can be useful
  static async getReplies(message: Message) {
    const chat = await message.getChat();
    const messages = await chat.fetchMessages({ limit: 100, fromMe: true });
    const msgsWithQuotedMsg = messages.filter(
      (message) => message.hasQuotedMsg
    );
    const msgWithQuotedMsgInstances = await Promise.all(
      msgsWithQuotedMsg.map((message) =>
        message.getQuotedMessage().then((quotedMsg) => ({ message, quotedMsg }))
      )
    );
    const msgsWithThisMessageQuoted = msgWithQuotedMsgInstances.filter(
      (msgWithQuotedMsgInstance) =>
        msgWithQuotedMsgInstance.quotedMsg.body === message.body
    );
    const replies = msgsWithThisMessageQuoted.map(
      (msgWithThisMessageQuoted) => msgWithThisMessageQuoted.message
    );
    return replies;
  }

  static async getReactionMessage(reaction: Reaction, client: YagamiClient) {
    try {
      const chat = await client.getChatById(reaction.id.remote);
      const recentMessages = await chat.fetchMessages({ limit: 10 });
      const message = recentMessages.find(
        (msg) => msg.id.id === reaction.msgId.id
      );
      if (!message) {
        throw new Error("Message not found");
      }
      return message;
    } catch (error) {
      throw new Error(error);
    }
  }
}
