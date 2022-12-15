import { Model, Mongoose } from "mongoose";
import Group from "../models/Group";

export default class GroupCollection {
  private GroupModel: Model<Group>;
  constructor(mongoose: Mongoose) {
    const GroupSchema = new mongoose.Schema({
      contactId: Object,
      name: String,
      totalCommandsCalled: Number,
      lastCommandExecuted: Date,
      banned: Boolean,
      lastCleanup: Date,
    });
    this.GroupModel = mongoose.model<Group>("groups", GroupSchema);
  }
  getAll = async () => {
    const Groups: Group[] = (await this.GroupModel.find().exec()) as Group[];
    return Groups;
  };

  removeAdmin = async (_serialized: string) => {
    return this.update(_serialized, { isAdmin: false });
  };

  increaseTotalCommandsCalled = async (_serialized: string) => {
    await this.update(_serialized, {
      $inc: { totalCommandsCalled: 1 },
      $set: { lastCommandExecuted: new Date() },
    });
  };

  find = async (query: object) => {
    return this.GroupModel.find(query).exec();
  };

  getByName = async (name: string) => {
    const Group: Group[] = (await this.GroupModel.find({
      name,
    }).exec()) as Group[];
    return Group;
  };
  getById = async (_serialized: string) => {
    const Group: Group = (await this.GroupModel.findOne({
      "contactId._serialized": _serialized,
    }).exec()) as Group;
    return Group;
  };

  create = async (group: Group) => {
    const createdGroup = new this.GroupModel(group);
    await createdGroup.save();
    return createdGroup;
  };

  update = async (_serialized: string, update: object) => {
    return this.GroupModel.findOneAndUpdate(
      { "contactId._serialized": _serialized },
      update
    );
  };

  delete = async (_serialized: string) => {
    return this.GroupModel.deleteOne({ contactId: { _serialized } }).exec();
  };
}
