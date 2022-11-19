import mongoose from "mongoose";
import { ContactId } from "whatsapp-web.js";

type UserPrimaryAttributes = {
	_id?: mongoose.Types.ObjectId;
	contactId: ContactId;
	name: string;
	isMyContact: boolean;
};
export default class User {
	public _id?: mongoose.Types.ObjectId;
	public contactId: ContactId;
	public name: string;
	public totalCommandsCalled: number;
	public lastCommandExecuted: Date | null;
	public isAdmin: boolean;
	public isVIP: boolean;
	public isMyContact: boolean;
	public banned: boolean;
	public commandBlocked: boolean;
	constructor(attributes: UserPrimaryAttributes) {
		if (attributes._id) this._id = attributes._id;
		this.contactId = attributes.contactId;
		this.name = attributes.name;
		this.isMyContact = attributes.isMyContact;
		this.totalCommandsCalled = 0;
		this.lastCommandExecuted = null;
		this.isAdmin = false;
		this.isVIP = false;
		this.banned = false;
		this.commandBlocked = false;
	}
}
