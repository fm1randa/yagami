import mongoose, { Mongoose } from "mongoose";

class MongooseState {
  private _mongoose: Mongoose;

  constructor() {
    this._mongoose = mongoose;
  }

  public get mongoose(): Mongoose {
    return this._mongoose;
  }

  public set mongoose(mongoose: Mongoose) {
    this._mongoose = mongoose;
  }
}

export default new MongooseState();
