import { Mongoose } from "mongoose";
import UserCollection from "./app/collections/User";
import GroupCollection from "./app/collections/Group";
import AudioCommandCollection from "./app/collections/AudioCommand";

class GlobalStates {
  private _mongoose: Mongoose;
  private _groupCollection: GroupCollection;
  private _userCollection: UserCollection;
  private _audioCollection: AudioCommandCollection;

  public get audioCommandCollection(): AudioCommandCollection {
    return this._audioCollection;
  }
  public set audioCommandCollection(value: AudioCommandCollection) {
    this._audioCollection = value;
  }

  public get userCollection(): UserCollection {
    return this._userCollection;
  }
  public set userCollection(value: UserCollection) {
    this._userCollection = value;
  }

  public get groupCollection(): GroupCollection {
    return this._groupCollection;
  }
  public set groupCollection(value: GroupCollection) {
    this._groupCollection = value;
  }

  public get mongoose(): Mongoose {
    return this._mongoose;
  }

  public set mongoose(mongoose: Mongoose) {
    this._mongoose = mongoose;
  }
}

export default new GlobalStates();
