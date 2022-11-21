import User from "../app/models/User";
import UserCollection from "../app/collections/User";
import { Client, Message } from "whatsapp-web.js";
import { chooseContact, logger } from "../helpers";

class Admins {
  async listAdmins(message: Message) {
    try {
      const admins: User[] = await UserCollection.getAdmins();
      const adminsLineBreak =
        "🤖 Admins:\n\n" + admins.map((admin) => admin.name).join("\n");
      message.reply(adminsLineBreak);
    } catch (error) {
      logger.error("Error while listing adminstrators: ", error);
    }
  }

  async addAdmin(message: Message, client: Client) {
    try {
      const { contact } = await chooseContact(client, message, {
        fromAnyUserInChat: true,
      });
      const admin = await UserCollection.getById(contact.id._serialized);
      if (!admin)
        return message.reply(
          "That contact isn't registered. This person must send a message to the bot first."
        );
      if (admin && admin.isAdmin)
        return message.reply("This contact is already an admin.");
      await UserCollection.addAdmin(contact.id._serialized);
      return message.reply(`🤖 ${admin.name} is now a bot admin!`);
    } catch (error) {
      const outputMessage = ((error: any) =>
        `Error while adding admin: ${error}`)(error);
      message.reply(outputMessage);
      logger.error(outputMessage);
    }
  }

  async removeAdmin(message: Message, client: Client) {
    try {
      const admins: User[] = await UserCollection.getAdmins();
      if (!admins.length)
        return message.reply("There are no admins registered yet.");
      const { contact } = await chooseContact(client, message, {
        fromAnyUserInChat: true,
      });
      const admin = admins.find(
        (admin) => admin.contactId._serialized === contact.id._serialized
      );
      if (!admin || !admin.isAdmin)
        return message.reply("This contact is not an admin.");
      await UserCollection.removeAdmin(contact.id._serialized);
      return message.reply(`🤖 ${admin.name} is no longer an bot admin!`);
    } catch (error) {
      logger.error("Error while removing admin: ", error);
    }
  }
}

export default new Admins();
