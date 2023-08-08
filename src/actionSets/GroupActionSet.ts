import Group from '../app/models/Group';
import { logger } from '../helpers';
import { type Message } from 'whatsapp-web.js';
import type YagamiClient from '../YagamiClient';
import globalStates from '../globalStates';

export const listGroups = async (message: Message) => {
  const { groupCollection } = globalStates;
  if (groupCollection === undefined) {
    logger.warn('Attempted to list groups but groupCollection is undefined');
    message.reply('Could not list groups.');
    return;
  }
  try {
    const Groups: Group[] = await groupCollection.getAll();
    const GroupsLineBreak =
      '🤖 Groups:\n\n' + Groups.map((group) => group.name).join('\n');
    message.reply(GroupsLineBreak);
  } catch (error) {
    logger.error('Error while listing groups: ', error);
  }
};

export const addGroup = async (message: Message, client: YagamiClient) => {
  const { groupCollection } = globalStates;
  if (groupCollection === undefined) {
    logger.warn('Attempted to add group but groupCollection is undefined');
    message.reply('Could not add group.');
    return;
  }
  try {
    const idSerialized = message.from;
    const group = await groupCollection.getById(idSerialized);
    const groupContact = await client.getContactById(idSerialized);
    if (group !== null) {
      logger.debug('Group already exists, updating...');
      const oldSerialized = group.contactId.user;
      if (group.name !== message.from) {
        group.name = groupContact.name ?? groupContact.pushname;
      }
      if (oldSerialized !== message.from) {
        group.contactId.user = groupContact.id.user;
        group.contactId.server = groupContact.id.server;
        group.contactId._serialized = groupContact.id._serialized;
      }
      return await groupCollection.update(oldSerialized, group);
    }
    if (!groupContact.isGroup) return;
    const newGroup = new Group({
      contactId: groupContact.id,
      name: groupContact.name ?? groupContact.pushname
    });
    return await groupCollection.create(newGroup);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message);
    }
  }
};

export const removeGroup = async (message: Message) => {
  const { groupCollection } = globalStates;
  if (groupCollection === undefined) {
    logger.warn('Attempted to remove group but groupCollection is undefined');
    message.reply('Could not remove group.');
    return;
  }
  const numberId = message.body.split(' ')[1];
  try {
    const Group = await groupCollection.getById(numberId);
    if (Group == null)
      return await message.reply('This group is not registered.');
    await groupCollection.delete(numberId);
    message.reply(`🤖 ${Group.name} is no longer registered!`);
  } catch (error) {
    logger.error('Error while removing group: ', error);
  }
};
