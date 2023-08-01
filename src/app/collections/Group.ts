import { type Model, type Mongoose } from 'mongoose'
import type Group from '../models/Group'

export default class GroupCollection {
  private readonly GroupModel: Model<Group>
  constructor (mongoose: Mongoose) {
    const GroupSchema = new mongoose.Schema({
      contactId: Object,
      name: String,
      totalCommandsCalled: Number,
      lastCommandExecuted: Date,
      banned: Boolean,
      lastCleanup: Date
    })
    this.GroupModel = mongoose.model<Group>('groups', GroupSchema)
  }

  getAll = async () => {
    const Groups: Group[] = (await this.GroupModel.find().exec())
    return Groups
  }

  removeAdmin = async (_serialized: string) => {
    return await this.update(_serialized, { isAdmin: false })
  }

  increaseTotalCommandsCalled = async (_serialized: string) => {
    await this.update(_serialized, {
      $inc: { totalCommandsCalled: 1 },
      $set: { lastCommandExecuted: new Date() }
    })
  }

  find = async (query: object) => {
    return await this.GroupModel.find(query).exec()
  }

  getByName = async (name: string) => {
    const Group: Group[] = (await this.GroupModel.find({
      name
    }).exec())
    return Group
  }

  getById = async (_serialized: string) => {
    return await this.GroupModel.findOne({
      'contactId._serialized': _serialized
    }).exec()
  }

  create = async (group: Group) => {
    const createdGroup = new this.GroupModel(group)
    await createdGroup.save()
    return createdGroup
  }

  update = async (_serialized: string, update: object) => {
    return await this.GroupModel.findOneAndUpdate(
      { 'contactId._serialized': _serialized },
      update
    )
  }

  delete = async (_serialized: string) => {
    return await this.GroupModel.deleteOne({ contactId: { _serialized } }).exec()
  }
}
