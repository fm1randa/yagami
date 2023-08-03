import type User from '../app/models/User'
import { type Message } from 'whatsapp-web.js'
import { chooseContact, logger } from '../helpers'
import globalStates from '../globalStates'
import type YagamiClient from '../YagamiClient'

export default class AdminActionSet {
  listAdmins = async (message: Message) => {
    try {
      const { userCollection } = globalStates
      if (userCollection === undefined) {
        logger.warn('Attempted to list admins but userCollection is undefined')
        message.reply('Could not list admins.')
        return
      }
      const admins: User[] = await userCollection.getAdmins()
      const adminsLineBreak =
        '🤖 Admins:\n\n' + admins.map((admin) => admin.name).join('\n')
      message.reply(adminsLineBreak)
    } catch (error) {
      logger.error('Error while listing adminstrators: ', error)
    }
  }

  addAdmin = async (message: Message, client: YagamiClient) => {
    try {
      const { userCollection } = globalStates
      if (userCollection === undefined) {
        logger.warn('Attempted to add admin but userCollection is undefined')
        message.reply('Could not add admin.')
        return
      }
      const { contact } = await chooseContact(client, message, {
        fromAnyUserInChat: true
      })
      const admin = await userCollection.getById(contact.id._serialized)
      if (admin === null) {
        return await message.reply(
          "That contact isn't registered. This person must send a message to the bot first."
        )
      }
      if (admin?.isAdmin) { return await message.reply('This contact is already an admin.') }
      await userCollection.addAdmin(contact.id._serialized)
      return await message.reply(`🤖 ${admin.name} is now a bot admin!`)
    } catch (error) {
      if (error instanceof Error) {
        message.reply(error.message)
        logger.error(error.message)
      }
    }
  }

  removeAdmin = async (message: Message, client: YagamiClient) => {
    const { userCollection } = globalStates
    if (userCollection === undefined) {
      logger.warn('Attempted to remove admin but userCollection is undefined')
      message.reply('Could not remove admin.')
      return
    }
    try {
      const admins: User[] = await userCollection.getAdmins()
      if (admins.length === 0) { return await message.reply('There are no admins registered yet.') }
      const { contact } = await chooseContact(client, message, {
        fromAnyUserInChat: true
      })
      const admin = admins.find(
        (admin) => admin.contactId._serialized === contact.id._serialized
      )
      if ((admin == null) || !admin.isAdmin) { return await message.reply('This contact is not an admin.') }
      await userCollection.removeAdmin(contact.id._serialized)
      return await message.reply(`🤖 ${admin.name} is no longer an bot admin!`)
    } catch (error) {
      logger.error('Error while removing admin: ', error)
    }
  }
}
