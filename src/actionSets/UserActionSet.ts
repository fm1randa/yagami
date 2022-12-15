import User from "../app/models/User";
import { logger } from "../helpers";
import UserCollection from "../app/collections/User";
import { Message } from "whatsapp-web.js";
import globalStates from "../globalStates";

export default class UserActionSet {
  private userCollection: UserCollection;
  constructor() {
    this.userCollection = globalStates.userCollection;
  }
  listUsers = async (message: Message) => {
    try {
      const Users: User[] = await this.userCollection.getAll();
      const UsersLineBreak =
        "🤖 Users:\n\n" + Users.map((user) => user.name).join("\n");
      message.reply(UsersLineBreak);
    } catch (error) {
      logger.error("Error while listing users: ", error);
    }
  };

  addUser = async (message: Message) => {
    try {
      const contact = await message.getContact();
      if (contact.isGroup) return;
      const user = await this.userCollection.getById(contact.id._serialized);
      if (user) return;
      const newUser = new User({
        contactId: contact.id,
        name: contact.name ?? contact.pushname,
        isMyContact: contact.isMyContact,
      });
      await this.userCollection.create(newUser);
    } catch (error) {
      const outputMessage = ((error: any) =>
        `Error while adding user: ${error}`)(error);
      logger.error(outputMessage);
    }
  };

  removeUser = async (message: Message) => {
    const numberId = message.body.split(" ")[1];
    try {
      const user = await this.userCollection.getById(numberId);
      if (!user) return message.reply("This user is not registered.");
      await this.userCollection.delete(numberId);
      message.reply(`🤖 ${user.name} is no longer registered!`);
    } catch (error) {
      logger.error("Error while removing user: ", error);
    }
  };
}
