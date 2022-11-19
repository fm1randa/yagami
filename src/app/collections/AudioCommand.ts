import mongoose from "mongoose";
import { AudioCommandType } from "src/actionSets/audios";

const AudioCommandSchema = new mongoose.Schema({
    trigger: String,
    audioFile: String,
});

const AudioCommandModel = mongoose.model("audio_commands", AudioCommandSchema);

class AudioCommandCollection {
    async getAll() {
        const audioCommands: AudioCommandType[] =
            (await AudioCommandModel.find().exec()) as AudioCommandType[];
        return audioCommands;
    }

    async get(trigger: string) {
        const audioCommand: AudioCommandType = (await AudioCommandModel.findOne(
            {
                trigger,
            }
        ).exec()) as AudioCommandType;
        return audioCommand;
    }

    async create(audioCommand: AudioCommandType) {
        const createdAudioCommand = new AudioCommandModel(audioCommand);
        await createdAudioCommand.save();
        return createdAudioCommand;
    }

    async delete(trigger: string) {
        return AudioCommandModel.deleteOne({ trigger }).exec();
    }
}

export default new AudioCommandCollection();
