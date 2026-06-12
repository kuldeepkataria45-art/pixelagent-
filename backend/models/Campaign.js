import mongoose from 'mongoose';

const LeadSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
  issue: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  status: { type: String, default: 'drafted' }, // drafted, sent
  pitch: { type: String, default: '' },
  meetingBooked: { type: Boolean, default: false },
  aiGenerated: { type: Boolean, default: false }
});

const CampaignSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  niche: { type: String, required: true },
  location: { type: String, required: true },
  size: { type: Number, required: true },
  status: { type: String, default: 'searching' }, // searching, auditing, completed, failed
  progress: { type: Number, default: 0 },
  leads: [LeadSchema],
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.models.Campaign || mongoose.model('Campaign', CampaignSchema);
