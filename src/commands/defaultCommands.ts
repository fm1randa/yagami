import AdminActionSet from "../actionSets/AdminActionSet";
import Command from "../Command";
import addFirstAdmin from "./addFirstAdmin";

export default function getDefaultCommands() {
  const adminActionSet = new AdminActionSet();

  return [
    addFirstAdmin,
    new Command("List admins", {
      trigger: {
        mainCheckRule: "exactly",
        mainText: "!admins",
      },
      action: adminActionSet.listAdmins,
      restricted: true,
      help: `Lists all the administrators that were added with the !addadmin command`,
      countAsCommandExecuted: false,
    }),
    new Command("Add admin", {
      trigger: {
        mainCheckRule: "exactly",
        mainText: "!addadm",
      },
      action: adminActionSet.addAdmin,
      restricted: true,
      help: `Allows a contact to use the commands that are restricted.`,
      countAsCommandExecuted: false,
    }),
    new Command("Remove admin", {
      trigger: {
        mainCheckRule: "exactly",
        mainText: "!rmadm",
      },
      action: adminActionSet.removeAdmin,
      restricted: true,
      help: `Removes the administrator rights from a contact.`,
      countAsCommandExecuted: false,
    }),
  ];
}
