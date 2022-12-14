import { Types } from "mongoose";
import { ChatId } from "whatsapp-web.js";
import globalStates from "../../globalStates";

type GroupPrimaryAttributes = {
  _id?: Types.ObjectId;
  contactId: ChatId;
  name: string;
};
export default class Group {
  public _id?: Types.ObjectId;
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

  // TODO improve it later (maybe?)
  save = async () => {
    const { groupCollection } = globalStates;
    const find = await groupCollection.getById(this.contactId._serialized);
    if (find) {
      return groupCollection.update(this.contactId._serialized, this);
    }
    return groupCollection.create(this);
  };
}
