import Group from "../app/models/Group";
import { logger } from "../helpers";
import GroupCollection from "../app/collections/Group";
import { Message } from "whatsapp-web.js";
import YagamiClient from "../YagamiClient";

class Groups {
  async listGroups(message: Message) {
    try {
      const Groups: Group[] = await GroupCollection.getAll();
      const GroupsLineBreak =
        "🤖 Groups:\n\n" + Groups.map((group) => group.name).join("\n");
      message.reply(GroupsLineBreak);
    } catch (error) {
      logger.error("Error while listing groups: ", error);
    }
  }

  async addGroup(message: Message, client: YagamiClient) {
    try {
      const idSerialized = message.from;
      const group = await GroupCollection.getById(idSerialized);
      if (group) return;
      const groupContact = await client.getContactById(idSerialized);
      if (!groupContact.isGroup) return;
      const newGroup = new Group({
        contactId: groupContact.id,
        name: groupContact.name,
      });
      await GroupCollection.create(newGroup);
    } catch (error) {
      const outputMessage = ((error: any) =>
        `Error while adding group: ${error}`)(error);
      logger.error(outputMessage);
    }
  }

  async removeGroup(message: Message) {
    const numberId = message.body.split(" ")[1];
    try {
      const Group = await GroupCollection.getById(numberId);
      if (!Group) return message.reply("This group is not registered.");
      await GroupCollection.delete(numberId);
      message.reply(`🤖 ${Group.name} is no longer registered!`);
    } catch (error) {
      logger.error("Error while removing group: ", error);
    }
  }
}

export default new Groups();
