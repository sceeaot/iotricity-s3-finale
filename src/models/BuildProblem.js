import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  pathId: { type: String, default: 'path-01', unique: true },
  pathTitle: { type: String, default: 'PATH 01 — "THE SILENT WATCHER"' },
  narrative: { type: String, required: true },
  missionBrief: { type: String, required: true },
  whatToBuild: { type: String, required: true },
  minimumRequirements: [{ type: String }],
  bonusFeatures: [{ type: String }],
  freeMaterials: [{ type: String }],
  components: [
    {
      id: String,
      name: String,
      cyberpunkName: String,
      cost: Number,
      category: String,
      role: String,
      imageUrl: String,
      status: String,
    },
  ],
  subPoints: [
    {
      id: String,
      title: String,
      points: String,
      badge: String,
      badgeColor: String,
      items: [String],
    },
  ],
  allStagesCompleteMessage: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.BuildProblem || mongoose.model('BuildProblem', schema);
