import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  stageNumber: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  type: { type: String, default: 'Direct' },
  location: { type: String, default: '' },
  message: { type: String, required: true },
  puzzle: { type: String, required: true },
  checkpointKey: { type: String, default: '' },
  successMessage: { type: String, default: '' },
  correctAnswer: { type: String, required: true },
  answerAliases: { type: [String], default: [] },
  coinsReward: { type: Number, required: true },
  wrongPenalty: { type: Number, default: 0 },
  hints: [{ text: String, cost: Number }],
});

if (
  mongoose.models.Stage &&
  (!mongoose.models.Stage.schema?.paths?.wrongPenalty || !mongoose.models.Stage.schema?.paths?.checkpointKey)
) {
  delete mongoose.models.Stage;
}

export default mongoose.models.Stage || mongoose.model('Stage', schema);