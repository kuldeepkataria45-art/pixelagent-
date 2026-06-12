import mongoose from 'mongoose';

const InboxSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  leadName: { type: String, required: true },
  leadEmail: { type: String, required: true },
  subject: { type: String, required: true },
  content: { type: String, required: true },
  status: { type: String, default: 'unread' }, // unread, replied, meeting_booked
  timestamp: { type: Date, default: Date.now },
  reply: { type: String, default: '' },
  objectionCategory: { type: String, default: '' },
  tacticsUsed: { type: [String], default: [] },
  aiGenerated: { type: Boolean, default: false }
});

export default mongoose.models.Inbox || mongoose.model('Inbox', InboxSchema);
