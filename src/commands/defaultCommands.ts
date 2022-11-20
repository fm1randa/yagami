import admins from "../actionSets/admins";
import vips from "../actionSets/vips";
import Command from "../Command";
import addFirstAdmin from "./addFirstAdmin";

const defaultCommands = [
  addFirstAdmin,
  new Command("Lista os administradores", {
    trigger: {
      mainCheckRule: "exactly",
      mainText: "!admins",
    },
    action: admins.listAdmins,
    restricted: true,
    help: `Mostra todos os administradores que foram adicionados com o comando !addadmin`,
    countAsCommandExecuted: false,
  }),
  new Command("Adiciona um administrador", {
    trigger: {
      mainCheckRule: "exactly",
      mainText: "!addadm",
    },
    action: admins.addAdmin,
    restricted: true,
    help: `Permite um contato utilizar os comandos que são restritos.`,
    countAsCommandExecuted: false,
  }),
  new Command("Remove um administrador", {
    trigger: {
      mainCheckRule: "exactly",
      mainText: "!rmadm",
    },
    action: admins.removeAdmin,
    restricted: true,
    help: `Remove os direitos de administrador de um contato.`,
    countAsCommandExecuted: false,
  }),
  new Command("Lista os VIPs", {
    trigger: {
      mainCheckRule: "exactly",
      mainText: "!vips",
    },
    action: vips.listVIPs,
    restricted: true,
    help: `Mostra todos os VIPs que foram adicionados com o comando !addvip`,
    countAsCommandExecuted: false,
  }),
  new Command("Adiciona um VIP", {
    trigger: {
      mainCheckRule: "exactly",
      mainText: "!addvip",
    },
    action: vips.addVIP,
    restricted: true,
    help: `Permite um contato utilizar os comandos sem limite.`,
    countAsCommandExecuted: false,
  }),
  new Command("Remove um VIP", {
    trigger: {
      mainCheckRule: "exactly",
      mainText: "!rmvip",
    },
    action: vips.removeVIP,
    restricted: true,
    help: `Remove os direitos de VIP de um contato.`,
    countAsCommandExecuted: false,
  }),
];
export default defaultCommands;
