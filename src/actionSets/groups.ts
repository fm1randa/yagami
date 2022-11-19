import Group from "../app/models/Group";
import { logger } from "../helpers";
import GroupCollection from "../app/collections/Group";
import { Message } from "whatsapp-web.js";
import Yagami from "src/Yagami";

class Groups {
    async listGroups(message: Message) {
        try {
            const Groups: Group[] = await GroupCollection.getAll();
            const GroupsLineBreak =
                "🤖 Grupos:\n\n" + Groups.map((group) => group.name).join("\n");
            message.reply(GroupsLineBreak);
        } catch (error) {
            logger.error("Erro ao listar grupos: ", error);
        }
    }

    async addGroup(message: Message, client: Yagami) {
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
                `Erro ao adicionar grupo: ${error}`)(error);
            logger.error(outputMessage);
        }
    }

    async removeGroup(message: Message) {
        const numberId = message.body.split(" ")[1];
        try {
            const Group = await GroupCollection.getById(numberId);
            if (!Group) return message.reply("Grupo não encontrado.");
            await GroupCollection.delete(numberId);
            message.reply(`🤖 ${Group.name} não é mais um(a) grupo(a) do bot!`);
        } catch (error) {
            logger.error("Erro ao remover grupo: ", error);
        }
    }
}

export default new Groups();
