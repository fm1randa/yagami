import globalStates from '../globalStates';
import { type Message } from 'whatsapp-web.js';
import type WAWebJS from 'whatsapp-web.js';
import { logger } from '../helpers';

export interface AudioCommandType {
  trigger: string;
  audioFile: WAWebJS.MessageMedia['data'];
}

export default class AudioCommandActionSet {
  listAudioCommands = async (message: Message) => {
    const { audioCommandCollection } = globalStates;
    if (audioCommandCollection === undefined) {
      logger.warn(
        'Attempted to list audio commands but audioCommandCollection is undefined'
      );
      message.reply('Could not list audio commands.');
      return;
    }
    try {
      const audioCommands = await audioCommandCollection.getAllTriggers();
      const commandList =
        '😼😼😼~ÁUDIOS~😼😼😼 \n\n' +
        audioCommands
          .sort((a, b) => a.localeCompare(b))
          .reduce((accumulator, current) => {
            return accumulator + `*★ ${current}*\n`;
          }, '') +
        '\n\n🤖';

      message.reply(commandList);
    } catch (error) {
      logger.error('Erro ao obter comandos de áudio: ', error);
    }
  };

  addAudioCommand = async (message: Message) => {
    const { audioCommandCollection } = globalStates;
    if (audioCommandCollection === undefined) {
      logger.warn(
        'Attempted to add audio command but audioCommandCollection is undefined'
      );
      message.reply('Could not add audio command.');
      return;
    }
    const [, trigger] = message.body.split(' ');
    const quotedMessage = await message.getQuotedMessage();

    if (!quotedMessage.hasMedia) return await message.reply('Marque um áudio!');

    const media = await quotedMessage.downloadMedia();
    if (!media.mimetype.includes('audio')) {
      return await message.reply('Marque um áudio!');
    }

    if (trigger === '') {
      return await message.reply(
        '🤖 Por favor, informe o trigger! Exemplo: *!batatafrita*\n\n_Tem que começar com exclamação._'
      );
    }

    try {
      const audioCommand: AudioCommandType = {
        trigger,
        audioFile: media.data
      };
      await audioCommandCollection.create(audioCommand);
      message.reply('🤖 Comando de áudio adicionado!');
    } catch (error) {
      logger.error('Erro ao adicionar comando de áudio: ', error);
    }
  };

  removeAudioCommand = async (message: Message) => {
    const { audioCommandCollection } = globalStates;
    if (audioCommandCollection === undefined) {
      logger.warn(
        'Attempted to remove audio command but audioCommandCollection is undefined'
      );
      message.reply('Could not remove audio command.');
      return;
    }
    const trigger = message.body.split(' ')[1];
    if (trigger === '') {
      return await message.reply(
        '🤖 Por favor, informe o comando!\n\nDigite !ajuda !rmaudio para mais informações.'
      );
    }
    try {
      const find = await audioCommandCollection.get(trigger);
      if (find !== undefined) {
        audioCommandCollection.delete(trigger);
        message.reply(`🤖 Comando ${trigger} removido com sucesso!`);
      } else {
        message.reply(`🤖 Comando ${trigger} não encontrado!`);
      }
    } catch (error) {
      logger.error('Erro ao remover comando de áudio: ', error);
    }
  };
}
