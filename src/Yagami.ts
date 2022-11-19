import qrcode from "qrcode-terminal";
import { Client, ClientOptions, LocalAuth, Message } from "whatsapp-web.js";
import path from "path";
import Command, { CheckRule } from "./Command";
import UserCollection from "./app/collections/User";
import GroupCollection from "./app/collections/Group";
import {
	copyDir,
	exactly,
	includes,
	msToTime,
	logger,
	remove,
	startsWith,
	ClientHelpers,
	measureExecutionTime,
} from "./helpers";
import os from "os";
import defaultCommands from "./defaultCommands";

export type CommandExecuted = {
	command: Command;
	timeElapsed: number;
	executionDate: Date;
};

export interface YagamiOptions extends ClientOptions {
	handleSignups?: boolean;
}

export default class Yagami extends Client {
	public commands: Command[];
	public authStrategy: LocalAuth;
	public clientId: string;
	private handleSignups: boolean;
	public startTime: Date;
	public lastCommandsExecuted: CommandExecuted[];
	public commandsExecuted: number;
	constructor(commmands: Command[], options: YagamiOptions) {
		super(options);
		this.commands = [...defaultCommands, ...commmands];
		this.authStrategy = options.authStrategy;
		this.clientId = this.authStrategy.clientId;
		this.handleSignups = options.handleSignups || false;
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
		logger.info(`${this.clientId} client is initializing...`);

		this.on("qr", (qr) => {
			logger.info(`${this.clientId} client QR code:`);
			qrcode.generate(qr, { small: true });
		});

		this.on("authenticated", () => {
			logger.info(`${this.clientId} AUTHENTICATED`);
		});

		this.on("auth_failure", (msg) => {
			logger.error(`${this.clientId} AUTHENTICATION FAILURE`, msg);
		});

		this.on("disconnected", () => {
			logger.warn(`${this.clientId} DISCONNECTED, RECONNECTING...`);
			this.initialize();
		});

		this.on("ready", async () => {
			logger.info(
				`${
					this.clientId
				} client is ready! Version: ${await this.getWWebVersion()}`
			);
		});
		this.on(
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
		);

		this.on("message_create", async (message) => {
			if (this.handleSignups) {
				ClientHelpers.handleSignups(message, this);
			}
			if (ClientHelpers.isUselessMessage(message)) {
				return;
			}
			this.executeCommands(message);
		});

		this.on("message_reaction", async (reaction) => {
			if (reaction.reaction !== "❌") return;
			try {
				const reactionMessage = await ClientHelpers.getReactionMessage(
					reaction,
					this
				);
				if (reactionMessage.fromMe) {
					reactionMessage.delete(true);
				}
			} catch (error) {
				logger.error(
					'Ocorreu um erro ao deletar uma mensagem reagida com "❌"',
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
		this.commands.forEach((command) => {
			this.executeCommand(message, command);
		});
	}

	async executeCommand(message: Message, command: Command) {
		const { action, trigger, restricted } = command.attributes;
		const messageMatchesTrigger: boolean = await ClientHelpers.matches({
			client: this,
			message,
			trigger,
		});
		if (!messageMatchesTrigger) {
			return;
		}
		const { userHasPermission } = await ClientHelpers.checkPermissions({
			client: this,
			message,
			restricted,
		});
		if (!userHasPermission) {
			return;
		}

		const { count, finalExecutionDate } = await measureExecutionTime(
			async () => {
				const logReactError = (error: Error) =>
					logger.error("Erro ao reagir à mensagem.", error);
				await message.react("🔄").catch(logReactError);
				await action(message, this);
				message.react("✅").catch(logReactError);
			}
		);
		const commandExecuted: CommandExecuted = {
			command,
			timeElapsed: count,
			executionDate: finalExecutionDate,
		};
		if (command.attributes.countAsCommandExecuted) {
			this.updateCommandsExecuted(commandExecuted);
		}
		this.emit("command_executed", commandExecuted, message);
		return Promise.resolve();
	}

	getChecker(checkRule: CheckRule): Function {
		switch (checkRule) {
			case "exactly":
				return exactly;
			case "startsWith":
				return startsWith;
			case "includes":
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
		const divider = `------------------------------------------------------`;
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

	restoreSessionBackup() {
		logger.info(`${this.clientId} RESTORING SESSION BACKUP...`);
		remove(path.join("./", `.wwebjs_auth_${this.clientId}`), async () => {
			try {
				await copyDir(
					path.join("./", `.wwebjs_auth_${this.clientId}` + "_BACKUP"),
					path.join("./", `.wwebjs_auth_${this.clientId}`)
				);
				logger.info(`${this.clientId} SESSION RESTORED`);
				this.initialize();
				logger.info(`${this.clientId} is trying to initializing again...`);
			} catch (error) {
				logger.error(`${this.clientId} ERROR RESTORING SESSION BACKUP`, error);
			}
		});
	}

	createSessionBackup() {
		logger.info(`${this.clientId} CREATING SESSION BACKUP...`);
		remove(path.join("/", `.wwebjs_auth_${this.clientId}` + "_BACKUP"), () => {
			copyDir(
				path.join("./", `.wwebjs_auth_${this.clientId}`),
				path.join("./", `.wwebjs_auth_${this.clientId}` + "_BACKUP")
			)
				.then(() => {
					logger.info(`${this.clientId} SESSION BACKUP CREATED`);
				})
				.catch((error) =>
					logger.error(
						`${this.clientId} ERROR CREATING SESSION BACKUP: `,
						error
					)
				);
		});
	}
}
