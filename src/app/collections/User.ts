import { logger } from "../../helpers";
import User from "../models/User";
import mongooseState from "./mongooseState";

const mongoose = mongooseState.mongoose;

const UserSchema = new mongoose.Schema({
  contactId: Object,
  name: String,
  totalCommandsCalled: Number,
  lastCommandExecuted: Date,
  isAdmin: Boolean,
  banned: Boolean,
  isMyContact: Boolean,
});

const UserModel = mongoose.model("users", UserSchema);

class UserCollection {
  async getAll() {
    const users: User[] = (await UserModel.find().exec()) as User[];
    return users;
  }

  async getAdmins() {
    const admins: User[] = (await this.find({ isAdmin: true })) as User[];
    return admins;
  }

  async addAdmin(_serialized: string) {
    return this.update(_serialized, { isAdmin: true });
  }

  async removeAdmin(_serialized: string) {
    return this.update(_serialized, { isAdmin: false });
  }

  async increaseTotalCommandsCalled(_serialized: string) {
    try {
      await this.update(_serialized, {
        $inc: { totalCommandsCalled: 1 },
        $set: { lastCommandExecuted: new Date() },
      });
      const user = await this.getById(_serialized);
      if (!user) return;
    } catch (error) {
      logger.error(
        "Erro ao incrementar o número de comandos executados do usuário",
        error
      );
    }
  }

  async find(query: object) {
    return UserModel.find(query).exec();
  }

  async getByName(name: string) {
    const user: User[] = (await UserModel.find({
      name,
    }).exec()) as User[];
    return user;
  }
  async getById(_serialized: string) {
    console.log(UserModel.db.host)
    const user: User = (await UserModel.findOne({
      "contactId._serialized": _serialized,
    }).exec()) as User;
    return user;
  }

  async create(user: User) {
    const createdUser = new UserModel(user);
    await createdUser.save();
    return createdUser;
  }

  async update(_serialized: string, update: object) {
    return UserModel.findOneAndUpdate(
      { "contactId._serialized": _serialized },
      update
    );
  }

  async delete(_serialized: string) {
    return UserModel.deleteOne({ contactId: { _serialized } }).exec();
  }
}

export default new UserCollection();
