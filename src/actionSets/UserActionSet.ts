import User from '../app/models/User';
import { logger } from '../helpers';
import { type Message } from 'whatsapp-web.js';
import globalStates from '../globalStates';

export const listUsers = async (message: Message) => {
  const { userCollection } = globalStates;
  if (userCollection === undefined) {
    logger.warn('Attempted to list users but userCollection is undefined');
    message.reply('Could not list users.');
    return;
  }
  try {
    const Users: User[] = await userCollection.getAll();
    const UsersLineBreak =
      '🤖 Users:\n\n' + Users.map((user) => user.name).join('\n');
    message.reply(UsersLineBreak);
  } catch (error) {
    logger.error('Error while listing users: ', error);
  }
};

export const addUser = async (message: Message) => {
  const { userCollection } = globalStates;
  if (userCollection === undefined) {
    logger.warn('Attempted to add user but userCollection is undefined');
    message.reply('Could not add user.');
    return;
  }
  try {
    const contact = await message.getContact();
    if (contact.isGroup) return;
    const user = await userCollection.getById(contact.id.user);
    if (user !== null) {
      logger.debug('User already exists, updating...');
      const oldSerialized = user.contactId.user;
      if (user.name !== contact.name) {
        user.name = contact.name ?? contact.pushname;
      }
      if (user.isMyContact !== contact.isMyContact) {
        user.isMyContact = contact.isMyContact;
      }
      if (oldSerialized !== contact.id.user) {
        user.contactId.user = contact.id.user;
        user.contactId.server = contact.id.server;
        user.contactId.user = contact.id.user;
      }
      return await userCollection.update(oldSerialized, user);
    }
    logger.debug('User does not exist, creating...');
    const newUser = new User({
      contactId: contact.id,
      name: contact.name ?? contact.pushname,
      isMyContact: contact.isMyContact
    });
    return await userCollection.create(newUser);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message);
    }
  }
};

export const removeUser = async (message: Message) => {
  const { userCollection } = globalStates;
  if (userCollection === undefined) {
    logger.warn('Attempted to remove user but userCollection is undefined');
    message.reply('Could not remove user.');
    return;
  }
  const numberId = message.body.split(' ')[1];
  try {
    const user = await userCollection.getById(numberId);
    if (user === null) {
      return await message.reply('This user is not registered.');
    }
    await userCollection.delete(numberId);
    message.reply(`🤖 ${user.name} is no longer registered!`);
  } catch (error) {
    logger.error('Error while removing user: ', error);
  }
};
