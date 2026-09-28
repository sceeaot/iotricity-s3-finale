import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  stageNumber: { type: Number, required: true },
  isUnlocked: { type: Boolean, default: false },
  isPuzzleUnlocked: { type: Boolean, default: false },
  isSolved: { type: Boolean, default: false },
  solvedAt: { type: Date, default: null },
  hintsRevealed: { type: [Number], default: [] },
  attempts: { type: Number, default: 0 },
  wrongGuesses: { type: Number, default: 0 },
});

if (mongoose.models.TeamStageState && !mongoose.models.TeamStageState.schema?.paths?.isPuzzleUnlocked) {
  delete mongoose.models.TeamStageState;
}

export default mongoose.models.TeamStageState || mongoose.model('TeamStageState', schema);