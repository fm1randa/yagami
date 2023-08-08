import { type Model, type Mongoose } from 'mongoose';
import { type AudioCommandType } from '../../actionSets/AudioCommandActionSet';

export default class AudioCommandCollection {
  private readonly AudioCommandModel: Model<AudioCommandType>;
  constructor(mongoose: Mongoose) {
    const AudioCommandSchema = new mongoose.Schema({
      trigger: String,
      audioFile: String
    });

    this.AudioCommandModel = mongoose.model<AudioCommandType>(
      'audio_commands',
      AudioCommandSchema
    );
  }

  getAllTriggers = async () => {
    const audioCommands: AudioCommandType[] =
      (await this.AudioCommandModel.find()
        .select({
          trigger: 1,
          _id: 0
        })
        .exec()) as AudioCommandType[];
    return audioCommands.map((audioCommand) => audioCommand.trigger);
  };

  getAll = async () => {
    const audioCommands: AudioCommandType[] =
      (await this.AudioCommandModel.find().exec()) as AudioCommandType[];
    return audioCommands;
  };

  get = async (trigger: string) => {
    const audioCommand: AudioCommandType =
      (await this.AudioCommandModel.findOne({
        trigger
      }).exec()) as AudioCommandType;
    return audioCommand;
  };

  getAudioFile = async (trigger: string) => {
    const audioCommand: AudioCommandType =
      (await this.AudioCommandModel.findOne({
        trigger
      })
        .select({
          audioFile: 1,
          _id: 0
        })
        .exec()) as AudioCommandType;
    return audioCommand.audioFile;
  };

  create = async (audioCommand: AudioCommandType) => {
    const createdAudioCommand = new this.AudioCommandModel(audioCommand);
    await createdAudioCommand.save();
    return createdAudioCommand;
  };

  delete = async (trigger: string) => {
    await this.AudioCommandModel.deleteOne({ trigger }).exec();
  };
}
