import User from "../app/models/User";
import { logger } from "../helpers";
import UserCollection from "../app/collections/User";
import { Message } from "whatsapp-web.js";

class Users {
	async listUsers(message: Message) {
		try {
			const Users: User[] = await UserCollection.getAll();
			const UsersLineBreak =
				"🤖 Usuários:\n\n" + Users.map((user) => user.name).join("\n");
			message.reply(UsersLineBreak);
		} catch (error) {
			logger.error("Erro ao listar usuários: ", error);
		}
	}

	async addUser(message: Message) {
		try {
			const contact = await message.getContact();
			if (contact.isGroup) return;
			const user = await UserCollection.getById(contact.id._serialized);
			if (user) return;
			const newUser = new User({
				contactId: contact.id,
				name: contact.name ?? contact.pushname,
				isMyContact: contact.isMyContact,
			});
			await UserCollection.create(newUser);
		} catch (error) {
			const outputMessage = ((error: any) =>
				`Erro ao adicionar usuário: ${error}`)(error);
			logger.error(outputMessage);
		}
	}

	async removeUser(message: Message) {
		const numberId = message.body.split(" ")[1];
		try {
			const user = await UserCollection.getById(numberId);
			if (!user) return message.reply("Usuário não encontrado.");
			await UserCollection.delete(numberId);
			message.reply(`🤖 ${user.name} não é mais um(a) usuário(a) do bot!`);
		} catch (error) {
			logger.error("Erro ao remover usuário: ", error);
		}
	}
}

export default new Users();
