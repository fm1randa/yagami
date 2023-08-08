import qrcode from 'qrcode-terminal';
import {
  Client,
  type ClientOptions,
  type LocalAuth,
  type Message
} from 'whatsapp-web.js';
import { type CheckRule } from './Command';
import type Command from './Command';
import {
  exactly,
  includes,
  msToTime,
  logger,
  startsWith,
  ClientHelpers,
  measureExecutionTime,
  capString
} from './helpers';
import os from 'os';
import getDefaultCommands from './commands/defaultCommands';
import handleAudioCommands from './handleAudioCommands';

export interface CommandExecuted {
  command: Command;
  timeElapsed: number;
  executionDate: Date;
}

export interface YagamiOptions extends ClientOptions {
  handleSignups?: boolean;
}

export default class YagamiClient extends Client {
  public commands: Command[];
  public authStrategy?: LocalAuth;
  public clientId?: string;
  private readonly handleSignups: boolean;
  public startTime: Date;
  public lastCommandsExecuted: CommandExecuted[];
  public commandsExecuted: number;
  constructor(commmands: Command[], options: YagamiOptions) {
    super(options);
    const defaultCommands = getDefaultCommands();
    this.commands = [...defaultCommands, ...commmands];
    this.authStrategy = options.authStrategy;
    this.clientId = this.authStrategy?.clientId;
    this.handleSignups = options.handleSignups === true || false;
    this.startTime = new Date();
    this.lastCommandsExecuted = [];
    this.commandsExecuted = 0;
  }

  get uptime() {
    return new Date().getTime() - this.startTime.getTime();
  }

  get executionTimeAvg() {
    return (
      this.lastCommandsExecuted.reduce(
        (acc, curr) => acc + curr.timeElapsed,
        0
      ) / this.lastCommandsExecuted.length
    );
  }

  init() {
    logger.info(`${this.clientId ?? 'Yagami'} is initializing...`);

    this.on('qr', (qr) => {
      logger.info(`${this.clientId ?? 'Yagami'} QR code:`);
      qrcode.generate(qr, { small: true });
    });

    this.on('code', (code) => {
      logger.info(
        `${
          this.clientId ?? 'Yagami'
        } client code to link with phone number: ${code}`
      );
    });

    this.on('loading_screen', (percent) => {
      logger.info(`${this.clientId ?? 'Yagami'} is loading chats: ${percent}%`);
    });

    this.on('authenticated', () => {
      logger.info(`${this.clientId ?? 'Yagami'} authenticated 🌐`);
    });

    this.on('auth_failure', (msg) => {
      logger.error(`${this.clientId ?? 'Yagami'} failed to authenticate.`, msg);
    });

    this.on('disconnected', () => {
      logger.warn(`${this.clientId ?? 'Yagami'} disconnected, reconnecting...`);
      this.initialize();
    });

    this.on('ready', () => {
      this.getWWebVersion().then((version) => {
        logger.info(
          `${this.clientId ?? 'Yagami'} is ready ✅ Version: ${version}`
        );
      });
    });
    /* this.on(
      "command_executed",
      async (commandExecuted: CommandExecuted, message: Message) => {
        const user = await message.getContact();
        const group = await this.getContactById(message.from);
        if (commandExecuted.command.attributes.countAsCommandExecuted) {
          UserCollection.increaseTotalCommandsCalled(user.id._serialized);
          if (group.isGroup) {
            GroupCollection.increaseTotalCommandsCalled(group.id._serialized);
          }
        }
        this.logCommandExecuted(commandExecuted);
      }
    ); */

    this.on('message_create', async (message) => {
      try {
        logger.debug(
          `Message from ${message.from} received: ${capString(
            message.body,
            50
          )}`
        );
        handleAudioCommands(message);

        const { handleSignups } = new ClientHelpers(this);
        if (this.handleSignups) {
          await handleSignups(message);
        }

        if (ClientHelpers.isUselessMessage(message)) {
          logger.debug('Message is useless, ignoring.');
          return;
        }

        logger.debug('Executing commands...');
        this.executeCommands(message);
      } catch (error) {
        logger.error('Error while handling a message.', error);
      }
    });

    this.on('message_reaction', (reaction) => {
      if (reaction.reaction !== '❌') return;
      try {
        const { getReactionMessage } = new ClientHelpers(this);
        getReactionMessage(reaction).then((reactionMessage) => {
          reactionMessage.delete(true);
        });
      } catch (error) {
        logger.debug(
          'Error while trying to delete message with reaction "❌".',
          error
        );
      }
    });

    this.initialize();
  }

  close() {
    this.startTime = new Date();
    this.lastCommandsExecuted = [];
    this.commandsExecuted = 0;
    this.destroy();
  }

  async executeCommands(message: Message) {
    const tasks = this.commands.map(
      async (command) => await this.executeCommand(message, command)
    );
    await Promise.all(tasks);
  }

  async executeCommand(message: Message, command: Command) {
    const { matches, checkPermissions } = ClientHelpers;
    const { action, trigger, restricted } = command.attributes;
    const messageMatchesTrigger: boolean = await matches({
      client: this,
      message,
      trigger
    });
    if (!messageMatchesTrigger) {
      return await Promise.resolve(null);
    }
    if (this.handleSignups && restricted) {
      const { userHasPermission } = await checkPermissions({
        message,
        restricted
      });
      if (!userHasPermission) {
        message.reply(
          "🔒 ❌ You don't have permission to execute this command."
        );
        return await Promise.resolve(null);
      }
    }

    const { count, finalExecutionDate } = await measureExecutionTime(
      async () => {
        const logReactError = (error: Error) =>
          logger.debug('Error while reacting to message.', error);
        await message.react('🔄').catch(logReactError);
        await action(message, this);
        message.react('✅').catch(logReactError);
      }
    );
    const commandExecuted: CommandExecuted = {
      command,
      timeElapsed: count,
      executionDate: finalExecutionDate
    };
    if (command.attributes.countAsCommandExecuted) {
      this.updateCommandsExecuted(commandExecuted);
    }
    this.emit('command_executed', commandExecuted, message);
    return await Promise.resolve(commandExecuted);
  }

  getChecker(checkRule: CheckRule) {
    switch (checkRule) {
      case 'exactly':
        return exactly;
      case 'startsWith':
        return startsWith;
      case 'includes':
        return includes;
    }
  }

  private updateCommandsExecuted(commandExecuted: CommandExecuted) {
    this.commandsExecuted++;
    this.lastCommandsExecuted.push(commandExecuted);
    if (this.lastCommandsExecuted.length > 10) {
      this.lastCommandsExecuted.shift();
    }
  }

  private logCommandExecuted(commandExecuted: CommandExecuted) {
    const commandTrigger = commandExecuted.command.attributes.trigger.mainText;
    const timeElapsed = msToTime(commandExecuted.timeElapsed);
    const executionTimeAvg = msToTime(this.executionTimeAvg);
    const commandRate = (
      this.commandsExecuted /
      100 /
      (this.uptime / 1000 / 60 / 60)
    ).toFixed(1);
    const freeMem = os.freemem() / 1024 / 1024 / 1024;
    const commandExecutedString = `\nCommand ${commandTrigger} executed!\n`;
    const timeElapsedString = `Time elapsed: ${timeElapsed}\n`;
    const avgL10String = `AvgL10: ${executionTimeAvg}\n`;
    const commandsExecutedString = `Commands executed: ${this.commandsExecuted}\n`;
    const uptimeString = `Uptime: ${msToTime(this.uptime)}\n`;
    const commandRateString = `Command rate: ${commandRate}\n`;
    const freeMemString = `Free mem: ${freeMem.toFixed(1)} GB\n`;
    const divider = '------------------------------------------------------';
    const output =
      commandExecutedString +
      timeElapsedString +
      avgL10String +
      commandsExecutedString +
      uptimeString +
      commandRateString +
      freeMemString +
      divider;
    logger.info(output);
  }
}
