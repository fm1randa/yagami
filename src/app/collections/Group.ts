import { type Model, type Mongoose } from 'mongoose';
import type Group from '../models/Group';
import { logger } from '../../helpers';

export default class GroupCollection {
  private readonly GroupModel: Model<Group>;
  constructor(mongoose: Mongoose) {
    const GroupSchema = new mongoose.Schema({
      contactId: Object,
      name: String,
      totalCommandsCalled: Number,
      lastCommandExecuted: Date,
      banned: Boolean,
      lastCleanup: Date
    });
    this.GroupModel = mongoose.model<Group>('groups', GroupSchema);
  }

  getAll = async () => {
    const Groups: Group[] = await this.GroupModel.find().exec();
    return Groups;
  };

  removeAdmin = async (user: string) => {
    return await this.update(user, { isAdmin: false });
  };

  increaseTotalCommandsCalled = async (user: string) => {
    await this.update(user, {
      $inc: { totalCommandsCalled: 1 },
      $set: { lastCommandExecuted: new Date() }
    });
  };

  find = async (query: object) => {
    return await this.GroupModel.find(query).exec();
  };

  getByName = async (name: string) => {
    const Group: Group[] = await this.GroupModel.find({
      name
    }).exec();
    return Group;
  };

  getById = async (user: string) => {
    return await this.GroupModel.findOne({
      'contactId.user': user
    }).exec();
  };

  create = async (group: Group) => {
    const createdGroup = new this.GroupModel(group);
    await createdGroup.save();
    return createdGroup;
  };

  update = async (user: string, update: object) => {
    return await this.GroupModel.findOneAndUpdate(
      { 'contactId.user': user },
      update
    );
  };

  delete = async (user: string) => {
    try {
      await this.GroupModel.deleteOne({
        contactId: { user }
      }).exec();
      return user;
    } catch (error) {
      logger.error(error);
      return null;
    }
  };
}
