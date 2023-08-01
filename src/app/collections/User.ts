import { type Mongoose, type Model } from 'mongoose'
import { logger } from '../../helpers'
import type User from '../models/User'

export default class UserCollection {
  private readonly UserModel: Model<User>
  constructor (mongoose: Mongoose) {
    const UserSchema = new mongoose.Schema({
      contactId: Object,
      name: String,
      totalCommandsCalled: Number,
      lastCommandExecuted: Date,
      isAdmin: Boolean,
      banned: Boolean,
      isMyContact: Boolean
    })
    this.UserModel = mongoose.model<User>('users', UserSchema)
  }

  getAll = async () => {
    const users: User[] = await this.UserModel.find().exec()
    return users
  }

  getAdmins = async () => {
    const admins: User[] = await this.find({ isAdmin: true })
    return admins
  }

  addAdmin = async (_serialized: string) => {
    return await this.update(_serialized, { isAdmin: true })
  }

  removeAdmin = async (_serialized: string) => {
    return await this.update(_serialized, { isAdmin: false })
  }

  increaseTotalCommandsCalled = async (_serialized: string) => {
    try {
      await this.update(_serialized, {
        $inc: { totalCommandsCalled: 1 },
        $set: { lastCommandExecuted: new Date() }
      })
    } catch (error) {
      logger.error(
        'Erro ao incrementar o número de comandos executados do usuário',
        error
      )
    }
  }

  find = async (query: object) => {
    return await this.UserModel.find(query).exec()
  }

  getByName = async (name: string) => {
    const user: User[] = await this.UserModel.find({
      name
    }).exec()
    return user
  }

  getById = async (_serialized: string) => {
    const user: User | null = await this.UserModel.findOne({
      'contactId._serialized': _serialized
    }).exec()
    return user
  }

  create = async (user: User) => {
    const createdUser = new this.UserModel(user)
    await createdUser.save()
    return createdUser
  }

  update = async (_serialized: string, update: object) => {
    return await this.UserModel.findOneAndUpdate(
      { 'contactId._serialized': _serialized },
      update
    )
  }

  delete = async (_serialized: string) => {
    return await this.UserModel.deleteOne({ contactId: { _serialized } }).exec()
  }
}
