import { type Mongoose, type Model } from 'mongoose';
import { logger } from '../../helpers';
import type User from '../models/User';

export default class UserCollection {
  private readonly UserModel: Model<User>;
  constructor(mongoose: Mongoose) {
    const UserSchema = new mongoose.Schema({
      contactId: Object,
      name: String,
      totalCommandsCalled: Number,
      lastCommandExecuted: Date,
      isAdmin: Boolean,
      banned: Boolean,
      isMyContact: Boolean
    });
    this.UserModel = mongoose.model<User>('users', UserSchema);
  }

  getAll = async () => {
    const users: User[] = await this.UserModel.find().exec();
    return users;
  };

  getAdmins = async () => {
    const admins: User[] = await this.find({ isAdmin: true });
    return admins;
  };

  addAdmin = async (user: string) => {
    return await this.update(user, { isAdmin: true });
  };

  removeAdmin = async (user: string) => {
    return await this.update(user, { isAdmin: false });
  };

  increaseTotalCommandsCalled = async (user: string) => {
    try {
      await this.update(user, {
        $inc: { totalCommandsCalled: 1 },
        $set: { lastCommandExecuted: new Date() }
      });
    } catch (error) {
      logger.error(
        'Erro ao incrementar o número de comandos executados do usuário',
        error
      );
    }
  };

  find = async (query: object) => {
    return await this.UserModel.find(query).exec();
  };

  getByName = async (name: string) => {
    const user: User[] = await this.UserModel.find({
      name
    }).exec();
    return user;
  };

  getById = async (user: string) => {
    logger.debug(`Getting user by id: ${user}`);
    const userEntity: User | null = await this.UserModel.findOne({
      'contactId.user': user
    }).exec();
    logger.debug(`Found: ${userEntity?.contactId.user ?? 'nothing'}`);
    return userEntity;
  };

  create = async (user: User) => {
    const createdUser = new this.UserModel(user);
    await createdUser.save();
    return createdUser;
  };

  update = async (user: string, update: object) => {
    return await this.UserModel.findOneAndUpdate(
      { 'contactId.user': user },
      update
    );
  };

  delete = async (user: string) => {
    try {
      await this.UserModel.deleteOne({ contactId: { user } }).exec();
      return user;
    } catch (error) {
      logger.error('Error while deleting user: ', error);
      return null;
    }
  };
}
