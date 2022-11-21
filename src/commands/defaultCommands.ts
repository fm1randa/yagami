import admins from "../actionSets/admins";
import Command from "../Command";
import addFirstAdmin from "./addFirstAdmin";

const defaultCommands = [
  addFirstAdmin,
  new Command("List admins", {
    trigger: {
      mainCheckRule: "exactly",
      mainText: "!admins",
    },
    action: admins.listAdmins,
    restricted: true,
    help: `Lists all the administrators that were added with the !addadmin command`,
    countAsCommandExecuted: false,
  }),
  new Command("Add admin", {
    trigger: {
      mainCheckRule: "exactly",
      mainText: "!addadm",
    },
    action: admins.addAdmin,
    restricted: true,
    help: `Allows a contact to use the commands that are restricted.`,
    countAsCommandExecuted: false,
  }),
  new Command("Remove admin", {
    trigger: {
      mainCheckRule: "exactly",
      mainText: "!rmadm",
    },
    action: admins.removeAdmin,
    restricted: true,
    help: `Removes the administrator rights from a contact.`,
    countAsCommandExecuted: false,
  }),
];
export default defaultCommands;
