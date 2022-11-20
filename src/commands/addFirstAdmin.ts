import { logger } from "../helpers";
import { Message } from "whatsapp-web.js";
import UserCollection from "../app/collections/User";
import Command from "../Command";

async function addFirstAdmin(message: Message) {
  try {
    const admins = await UserCollection.getAdmins();
    if (admins.length)
      return message.reply("Já há administradores cadastrados.");
    const contact = await message.getContact();
    const user = await UserCollection.getById(contact.id._serialized);
    if (!user)
      return message.reply(
        "Você não estava cadastrado no banco. Tente usar o comando novamente."
      );
    await UserCollection.addAdmin(contact.id._serialized);
    return message.reply(`🤖 $Você agora é um(a) administrador(a) do bot!`);
  } catch (error) {
    const outputMessage = ((error: any) =>
      `Erro ao adicionar primeiro administrador: ${error}`)(error);
    message.reply(outputMessage);
    logger.error(outputMessage);
  }
}

export default new Command("Adicionar primeiro administrador", {
  trigger: {
    mainText: "!addfirstadm",
    mainCheckRule: "exactly",
  },
  action: addFirstAdmin,
  restricted: false,
  help: `Apenas para o primeiro administrador. Adiciona o primeiro administrador ao banco de dados. O primeiro administrador é o usuário que chamar o comando !addfirstadmin.`,
  countAsCommandExecuted: false,
});
