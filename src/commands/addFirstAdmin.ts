import { logger } from '../helpers'
import { type Message } from 'whatsapp-web.js'
import Command from '../Command'
import globalStates from '../globalStates'

async function addFirstAdmin (message: Message) {
  const { userCollection } = globalStates
  try {
    const admins = await userCollection.getAdmins()
    if (admins.length > 0) { return await message.reply('There is already an admin registered.') }
    const contact = await message.getContact()
    const user = await userCollection.getById(contact.id._serialized)
    if (!user) {
      return await message.reply(
        'You were not register as a user yet. Please, try again.'
      )
    }
    await userCollection.addAdmin(contact.id._serialized)
    return await message.reply(`🤖 ${user.name} is now a bot admin!`)
  } catch (error) {
    const outputMessage = ((error: any) =>
      `Error while adding admin: ${error}`)(error)
    message.reply(outputMessage)
    logger.error(outputMessage)
  }
}

export default new Command('Add first administrator', {
  trigger: {
    mainText: '!addfirstadm',
    mainCheckRule: 'exactly'
  },
  action: addFirstAdmin,
  restricted: false,
  help: 'Only for the first administrator. Adds the first administrator to the database. The first administrator is the user who calls the !addfirstadm command.',
  countAsCommandExecuted: false
})
