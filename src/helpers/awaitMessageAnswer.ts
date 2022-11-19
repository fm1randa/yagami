import { Client, Message } from "whatsapp-web.js";

export type AwaitAnswerOptionsType = {
    requireQuote?: boolean;
    fromAnyUserInChat?: boolean;
};

type ValidateMessagesArgs = {
    options: AwaitAnswerOptionsType;
    afterMessage: Message;
    watchMessage: Message;
};

function awaitAnswer(
    client: Client,
    watchMessage: Message,
    options?: AwaitAnswerOptionsType
) {
    return new Promise<Message>((resolve, reject) => {
        const listener = async (afterMessage: Message) => {
            try {
                const fromSameChat = await isFromSameChat(
                    afterMessage,
                    watchMessage
                );
                if (!fromSameChat) {
                    return;
                }
                if (
                    !options?.fromAnyUserInChat &&
                    !isFromSameUser(afterMessage, watchMessage)
                ) {
                    return;
                }
                const isValid = await validateMessages({
                    options,
                    afterMessage,
                    watchMessage,
                });
                if (!isValid) {
                    reject(
                        "A mensagem não foi respondida. O comando foi cancelado."
                    );
                }
                resolve(afterMessage);

                client.removeListener("message_create", listener);
            } catch (error) {
                reject(error);
            }
        };
        client.on("message_create", listener);
    });
}
async function validateMessages(args: ValidateMessagesArgs) {
    const { options, afterMessage, watchMessage } = args;

    if (!options?.requireQuote) {
        return true;
    }

    const quoted = await afterMessage.getQuotedMessage();
    const quotedSameMessage = isSameMessage(quoted, watchMessage);

    if (!quotedSameMessage) {
        return false;
    }
    return true;
}

async function isFromSameChat(message: Message, watchMessage: Message) {
    const messageChat = await message.getChat();
    const watchMessageChat = await watchMessage.getChat();
    const sameId =
        messageChat.id._serialized === watchMessageChat.id._serialized;
    return sameId;
}

function isFromSameUser(message: Message, watchMessage: Message) {
    return message.from === watchMessage.from;
}

function isSameMessage(message: Message, watchMessage: Message) {
    return message.id.id === watchMessage.id.id;
}

export default awaitAnswer;
