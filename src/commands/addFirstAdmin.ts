import { logger } from "../helpers";
import { Message } from "whatsapp-web.js";
import UserCollection from "../app/collections/User";
import Command from "../Command";

async function addFirstAdmin(message: Message) {
  try {
    const admins = await UserCollection.getAdmins();
    if (admins.length)
      return message.reply("There is already an admin registered.");
    const contact = await message.getContact();
    const user = await UserCollection.getById(contact.id._serialized);
    if (!user)
      return message.reply(
        "You were not register as a user yet. Please, try again."
      );
    await UserCollection.addAdmin(contact.id._serialized);
    return message.reply(`🤖 ${user.name} is now a bot admin!`);
  } catch (error) {
    const outputMessage = ((error: any) =>
      `Error while adding admin: ${error}`)(error);
    message.reply(outputMessage);
    logger.error(outputMessage);
  }
}

export default new Command("Add first administrator", {
  trigger: {
    mainText: "!addfirstadm",
    mainCheckRule: "exactly",
  },
  action: addFirstAdmin,
  restricted: false,
  help: `Only for the first administrator. Adds the first administrator to the database. The first administrator is the user who calls the !addfirstadm command.`,
  countAsCommandExecuted: false,
});
