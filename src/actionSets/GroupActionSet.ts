import Group from '../app/models/Group'
import { logger } from '../helpers'
import type GroupCollection from '../app/collections/Group'
import { type Message } from 'whatsapp-web.js'
import type YagamiClient from '../YagamiClient'
import globalStates from '../globalStates'

export default class GroupActionSet {
  private readonly groupCollection: GroupCollection
  constructor () {
    this.groupCollection = globalStates.groupCollection
  }

  listGroups = async (message: Message) => {
    try {
      const Groups: Group[] = await this.groupCollection.getAll()
      const GroupsLineBreak =
        '🤖 Groups:\n\n' + Groups.map((group) => group.name).join('\n')
      message.reply(GroupsLineBreak)
    } catch (error) {
      logger.error('Error while listing groups: ', error)
    }
  }

  addGroup = async (message: Message, client: YagamiClient) => {
    try {
      const idSerialized = message.from
      const group = await this.groupCollection.getById(idSerialized)
      if (group) return
      const groupContact = await client.getContactById(idSerialized)
      if (!groupContact.isGroup) return
      const newGroup = new Group({
        contactId: groupContact.id,
        name: groupContact.name
      })
      await this.groupCollection.create(newGroup)
    } catch (error) {
      const outputMessage = ((error: any) =>
        `Error while adding group: ${error}`)(error)
      logger.error(outputMessage)
    }
  }

  removeGroup = async (message: Message) => {
    const numberId = message.body.split(' ')[1]
    try {
      const Group = await this.groupCollection.getById(numberId)
      if (!Group) return await message.reply('This group is not registered.')
      await this.groupCollection.delete(numberId)
      message.reply(`🤖 ${Group.name} is no longer registered!`)
    } catch (error) {
      logger.error('Error while removing group: ', error)
    }
  }
}
