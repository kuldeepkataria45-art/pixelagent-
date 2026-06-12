import mongoose from 'mongoose';

const HistorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  url: { type: String, required: true },
  niche: { type: String, required: true },
  status: { type: String, default: 'completed' },
  progress: { type: Number, default: 100 },
  results: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.models.History || mongoose.model('History', HistorySchema);
