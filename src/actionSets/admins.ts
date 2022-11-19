import { chooseContact, logger } from "../helpers";
import User from "../app/models/User";
import UserCollection from "../app/collections/User";
import { Client, Message } from "whatsapp-web.js";

class Admins {
	async listAdmins(message: Message) {
		try {
			const admins: User[] = await UserCollection.getAdmins();
			const adminsLineBreak =
				"🤖 Administradores:\n\n" +
				admins.map((admin) => admin.name).join("\n");
			message.reply(adminsLineBreak);
		} catch (error) {
			logger.error("Erro ao listar administradores: ", error);
		}
	}

	async addAdmin(message: Message, client: Client) {
		try {
			const { contact } = await chooseContact(client, message, {
				fromAnyUserInChat: true,
			});
			const admin = await UserCollection.getById(contact.id._serialized);
			if (!admin) return message.reply("Este contato não é um usuário.");
			if (admin && admin.isAdmin)
				return message.reply("Este contato já é um administrador.");
			await UserCollection.addAdmin(contact.id._serialized);
			return message.reply(
				`🤖 ${admin.name} agora é um(a) administrador(a) do bot!`
			);
		} catch (error) {
			const outputMessage = ((error: any) =>
				`Erro ao adicionar administrador: ${error}`)(error);
			message.reply(outputMessage);
			logger.error(outputMessage);
		}
	}

	async removeAdmin(message: Message, client: Client) {
		try {
			const admins: User[] = await UserCollection.getAdmins();
			if (!admins.length)
				return message.reply("Não há administradores cadastrados.");
			const { contact } = await chooseContact(client, message, {
				fromAnyUserInChat: true,
			});
			const admin = admins.find(
				(admin) => admin.contactId._serialized === contact.id._serialized
			);
			if (!admin || !admin.isAdmin)
				return message.reply("Este contato não é um administrador.");
			await UserCollection.removeAdmin(contact.id._serialized);
			return message.reply(
				`🤖 ${admin.name} não é mais um(a) administrador(a) do bot!`
			);
		} catch (error) {
			logger.error("Erro ao remover administrador: ", error);
		}
	}
}

export default new Admins();
