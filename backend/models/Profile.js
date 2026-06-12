import mongoose from 'mongoose';

const ProfileSchema = new mongoose.Schema({
  name: { type: String, default: "PixelPrairie" },
  techStack: { type: String, default: "Next.js 16, React, Tailwind CSS" },
  pricingFormula: { type: String, default: "Custom value-based pricing tailored to your business goals" },
  elevenlabsApiKey: { type: String, default: "" },
  elevenlabsAgentId: { type: String, default: "" },
  twilioSid: { type: String, default: "" },
  twilioAuthToken: { type: String, default: "" },
  twilioNumber: { type: String, default: "" },
  coreService: { type: String, default: "AI Voice Automation" },
  smtpHost: { type: String, default: "" },
  smtpPort: { type: String, default: "587" },
  smtpUser: { type: String, default: "" },
  smtpPass: { type: String, default: "" },
  smtpSender: { type: String, default: "" },
  googleApiKey: { type: String, default: "" },
  geminiApiKey: { type: String, default: "" },
  openaiApiKey: { type: String, default: "" },
  googleMapsApiKey: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.models.Profile || mongoose.model('Profile', ProfileSchema);
