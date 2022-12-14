import Group from "../models/Group";
import mongooseState from "./mongooseState";

const mongoose = mongooseState.mongoose;

const GroupSchema = new mongoose.Schema({
  contactId: Object,
  name: String,
  totalCommandsCalled: Number,
  lastCommandExecuted: Date,
  banned: Boolean,
  lastCleanup: Date,
});

const GroupModel = mongoose.model("groups", GroupSchema);

class GroupCollection {
  async getAll() {
    const Groups: Group[] = (await GroupModel.find().exec()) as Group[];
    return Groups;
  }

  async removeAdmin(_serialized: string) {
    return this.update(_serialized, { isAdmin: false });
  }

  async increaseTotalCommandsCalled(_serialized: string) {
    await this.update(_serialized, {
      $inc: { totalCommandsCalled: 1 },
      $set: { lastCommandExecuted: new Date() },
    });
  }

  async find(query: object) {
    return GroupModel.find(query).exec();
  }

  async getByName(name: string) {
    const Group: Group[] = (await GroupModel.find({
      name,
    }).exec()) as Group[];
    return Group;
  }
  async getById(_serialized: string) {
    const Group: Group = (await GroupModel.findOne({
      "contactId._serialized": _serialized,
    }).exec()) as Group;
    return Group;
  }

  async create(group: Group) {
    const createdGroup = new GroupModel(group);
    await createdGroup.save();
    return createdGroup;
  }

  async update(_serialized: string, update: object) {
    return GroupModel.findOneAndUpdate(
      { "contactId._serialized": _serialized },
      update
    );
  }

  async delete(_serialized: string) {
    return GroupModel.deleteOne({ contactId: { _serialized } }).exec();
  }
}

export default new GroupCollection();
