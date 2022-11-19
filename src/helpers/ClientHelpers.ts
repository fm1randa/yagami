import Yagami from "../Yagami";
import { Message, Reaction } from "whatsapp-web.js";
import groups from "../actionSets/groups";
import users from "../actionSets/users";
import User from "../app/models/User";
import UserCollection from "../app/collections/User";
import GroupCollection from "../app/collections/Group";
import { getMsUntilNow } from ".";
import logger from "./logger";
import { MessageProps, TriggerType } from "src/Command";

type MatchesOptionsType = {
    message: Message;
    trigger: TriggerType;
    client: Yagami;
};
type ChatPermissions = {
    groupIsVIP: boolean;
    userHasPermission: boolean;
    userIsCommandBlocked: boolean;
};

export default class ClientHelpers {
    static async cleanupGroup(message: Message, client: Yagami) {
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

    static handleSignups(message: Message, client: Yagami) {
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
        const match = (
            messageProps: MessageProps | MessageProps[]
        ): boolean => {
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
                logger.error("Erro ao verificar main text: ", error);
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

    static async isUserCommandBlocked(user: User) {
        const fromVIP = await this.isVIP(user);
        const fromAdmin = await this.isAdmin(user);
        const commandBlocked = user && user.commandBlocked;
        if (commandBlocked && !fromVIP && !fromAdmin) {
            return true;
        }
        return false;
    }

    static async isAdmin(user: User) {
        return user && user.isAdmin;
    }

    static async isVIP(user: User) {
        return user && user.isVIP;
    }

    static async getUserFromMessage(message: Message) {
        const contact = await message.getContact();
        return UserCollection.getById(contact.id._serialized);
    }

    static async isFromVIPGroup(message: Message, client: Yagami) {
        const contact = await client.getContactById(message.from);
        if (!contact.isGroup) {
            return false;
        }
        const group = await GroupCollection.getById(contact.id._serialized);
        return group && group.isVIP;
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
        client,
    }: {
        message: Message;
        restricted: boolean;
        client: Yagami;
    }): Promise<ChatPermissions> {
        const chatPermissions: ChatPermissions = {
            groupIsVIP: await this.isFromVIPGroup(message, client),
            userHasPermission: await this.hasUserPermission(
                message,
                restricted
            ),
            userIsCommandBlocked: await this.isUserCommandBlocked(
                await this.getUserFromMessage(message)
            ),
        };
        return chatPermissions;
    }
    static getRandomBlockMessage() {
        const fire =
            "🔥 Você tá pegando fogo nos comandos 🔥\n\n🥶 Pra continuar usando os comandos, fica frio aí 👇";
        const jail =
            "⛓️ Você usou tanto comando que foi preso ⛓️\n\n🔓 Pra dar fuga, acesse o link 👇";
        const stop =
            "✋ Parado aí ✋\n\n👉 Para continuar usando os comandos, acesse o link 👇";
        const messages = [fire, jail, stop];
        const randomMessage =
            messages[Math.floor(Math.random() * messages.length)];
        return randomMessage;
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
                message
                    .getQuotedMessage()
                    .then((quotedMsg) => ({ message, quotedMsg }))
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

    static async getReactionMessage(reaction: Reaction, client: Yagami) {
        try {
            const chat = await client.getChatById(reaction.id.remote);
            const recentMessages = await chat.fetchMessages({ limit: 10 });
            const message = recentMessages.find(
                (msg) => msg.id.id === reaction.msgId.id
            );
            if (!message) {
                throw new Error("Mensagem não encontrada");
            }
            return message;
        } catch (error) {
            throw new Error(error);
        }
    }
}
