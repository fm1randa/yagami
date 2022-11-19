import WAWebJS, { Message } from "whatsapp-web.js";
import { logger, remove } from "../helpers";
import AudioCommandCollection from "../app/collections/AudioCommand";

export type AudioCommandType = {
    trigger: string;
    audioFile: WAWebJS.MessageMedia["data"];
};

class Audios {
    async listAudioCommands(message: Message) {
        try {
            const audioCommands = await AudioCommandCollection.getAll();
            const commandList =
                "😼😼😼~ÁUDIOS~😼😼😼 \n\n" +
                audioCommands.reduce((accumulator, current) => {
                    return accumulator + `*★ ${current.trigger}*\n`;
                }, "") +
                "\n\n🤖";

            message.reply(commandList);
        } catch (error) {
            logger.error("Erro ao obter comandos de áudio: ", error);
        }
    }

    async addAudioCommand(message: Message) {
        const [, trigger] = message.body.split(" ");
        const quotedMessage = await message.getQuotedMessage();

        if (!quotedMessage.hasMedia) return message.reply("Marque um áudio!");

        const media = await quotedMessage.downloadMedia();
        if (!media.mimetype.includes("audio"))
            return message.reply("Marque um áudio!");

        if (!trigger)
            return message.reply(
                "🤖 Por favor, informe o trigger! Exemplo: *!batatafrita*\n\n_Tem que começar com exclamação._"
            );

        try {
            const audioCommand: AudioCommandType = {
                trigger,
                audioFile: media.data,
            };
            await AudioCommandCollection.create(audioCommand);
            message.reply(`🤖 Comando de áudio adicionado!`);
        } catch (error) {
            logger.error("Erro ao adicionar comando de áudio: ", error);
        }
    }

    async removeAudioCommand(message: Message) {
        const trigger = message.body.split(" ")[1];
        if (!trigger)
            return message.reply(
                "🤖 Por favor, informe o comando!\n\nDigite !ajuda !rmaudio para mais informações."
            );
        try {
            const find = await AudioCommandCollection.get(trigger);
            if (find) {
                AudioCommandCollection.delete(trigger);
                message.reply(`🤖 Comando ${trigger} removido com sucesso!`);
            } else {
                message.reply(`🤖 Comando ${trigger} não encontrado!`);
            }
        } catch (error) {
            logger.error("Erro ao remover comando de áudio: ", error);
        }
    }
}

export default new Audios();
