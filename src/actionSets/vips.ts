import { chooseContact, describeContact, logger } from "../helpers";
import User from "../app/models/User";
import UserCollection from "../app/collections/User";
import GroupCollection from "../app/collections/Group";
import { Client, Message } from "whatsapp-web.js";
import Group from "../app/models/Group";

class VIPs {
	async listVIPs(message: Message) {
		try {
			const VIPUsers: User[] = await UserCollection.getVIPs();
			const VIPGroups: Group[] = await GroupCollection.getVIPs();
			const VIPs = [...VIPUsers, ...VIPGroups];
			const VIPsLineBreak =
				"🤖 VIPs:\n\n" + VIPs.map((VIP) => VIP.name).join("\n");
			message.reply(VIPsLineBreak);
		} catch (error) {
			logger.error("Erro ao listar VIPs: ", error);
		}
	}

	async addVIP(message: Message, client: Client) {
		try {
			const { contact } = await chooseContact(client, message, {
				fromAnyUserInChat: true,
			});
			if (contact.isGroup) {
				console.log(contact);
				const group = await GroupCollection.getById(contact.id._serialized);
				console.log(group);
				if (!group) return message.reply("Este grupo não está cadastrado.");
				if (group && group.isVIP)
					return message.reply("Este grupo já é um VIP.");
				await GroupCollection.addVIP(contact.id._serialized);
			} else {
				const user = await UserCollection.getById(contact.id._serialized);
				if (!user) return message.reply("Este contato não está cadastrado.");
				if (user && user.isVIP)
					return message.reply("Este contato já é um VIP.");
				await UserCollection.addVIP(contact.id._serialized);
			}
			return message.reply(
				`🤖 ${describeContact(contact)} agora é um VIP do bot!`
			);
		} catch (error) {
			const outputMessage = ((error: any) => `Erro ao adicionar VIP: ${error}`)(
				error
			);
			message.reply(outputMessage);
			logger.error(outputMessage);
		}
	}

	async removeVIP(message: Message, client: Client) {
		try {
			const VIPUsers: User[] = await UserCollection.getVIPs();
			const VIPGroups: Group[] = await GroupCollection.getVIPs();
			const VIPs = [...VIPUsers, ...VIPGroups];
			if (!VIPs.length) return message.reply("Não há VIPs cadastrados.");
			const { contact } = await chooseContact(client, message, {
				fromAnyUserInChat: true,
			});
			const VIP = VIPs.find(
				(VIP) => VIP.contactId._serialized === contact.id._serialized
			);
			if (!VIP) return message.reply("Este contato não é um VIP.");
			if (contact.isGroup) {
				await GroupCollection.removeVIP(contact.id._serialized);
			} else {
				await UserCollection.removeVIP(contact.id._serialized);
			}
			return message.reply(
				`🤖 ${describeContact(contact)} não é mais um VIP do bot!`
			);
		} catch (error) {
			logger.error("Erro ao remover VIP: ", error);
		}
	}
}

export default new VIPs();
