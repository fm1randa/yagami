import mongoose from "mongoose";
import { ChatId } from "whatsapp-web.js";
import GroupCollection from "../collections/Group";

type GroupPrimaryAttributes = {
  _id?: mongoose.Types.ObjectId;
  contactId: ChatId;
  name: string;
};
export default class Group {
  public _id?: mongoose.Types.ObjectId;
  public contactId: ChatId;
  public name: string;
  public totalCommandsCalled: number;
  public lastCommandExecuted: Date | null;
  public banned: boolean;
  public lastCleanup: Date;

  constructor(attributes: GroupPrimaryAttributes) {
    if (attributes._id) this._id = attributes._id;
    this.contactId = attributes.contactId;
    this.name = attributes.name;
    this.totalCommandsCalled = 0;
    this.lastCommandExecuted = null;
    this.banned = false;
    this.lastCleanup = null;
  }

  async save() {
    const find = await GroupCollection.getById(this.contactId._serialized);
    if (find) {
      return GroupCollection.update(this.contactId._serialized, this);
    }
    return GroupCollection.create(this);
  }
}
