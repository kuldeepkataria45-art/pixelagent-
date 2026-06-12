// C:\Users\Tbodv\.gemini\antigravity\scratch\business-agent-workspace\backend\server.js

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { runAgent } from './agents.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

const PROFILE_PATH = path.join(__dirname, 'profile.json');
const HISTORY_PATH = path.join(__dirname, 'history.json');
const CAMPAIGNS_PATH = path.join(__dirname, 'campaigns.json');
const OBJECTIONS_PATH = path.join(__dirname, 'objections.json');
const INBOX_PATH = path.join(__dirname, 'inbox.json');

// Helper to read JSON safely
const readJsonFile = (filePath, defaultVal = {}) => {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
  }
  return defaultVal;
};

// Helper to write JSON safely
const writeJsonFile = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing file ${filePath}:`, err);
    return false;
  }
};

// Helper to read profile with environment variables fallback
const getProfile = () => {
  const fileProfile = readJsonFile(PROFILE_PATH, {
    name: "PixelPrairie",
    techStack: "Next.js 16, React, Tailwind CSS",
    pricingFormula: "Custom value-based pricing"
  });

  return {
    name: fileProfile.name || "PixelPrairie",
    techStack: fileProfile.techStack || "Next.js 16, React, Tailwind CSS",
    pricingFormula: fileProfile.pricingFormula || "Custom value-based pricing",
    elevenlabsApiKey: process.env.ELEVENLABS_API_KEY || fileProfile.elevenlabsApiKey || "",
    elevenlabsAgentId: process.env.ELEVENLABS_AGENT_ID || fileProfile.elevenlabsAgentId || "",
    twilioSid: process.env.TWILIO_SID || fileProfile.twilioSid || "",
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || fileProfile.twilioAuthToken || "",
    twilioNumber: process.env.TWILIO_NUMBER || fileProfile.twilioNumber || "",
    smtpHost: process.env.SMTP_HOST || fileProfile.smtpHost || "",
    smtpPort: process.env.SMTP_PORT || fileProfile.smtpPort || "587",
    smtpUser: process.env.SMTP_USER || fileProfile.smtpUser || "",
    smtpPass: process.env.SMTP_PASS || fileProfile.smtpPass || "",
    smtpSender: process.env.SMTP_SENDER || fileProfile.smtpSender || "",
    googleApiKey: process.env.GOOGLE_API_KEY || fileProfile.googleApiKey || "",
    geminiApiKey: process.env.GEMINI_API_KEY || fileProfile.geminiApiKey || "",
    openaiApiKey: process.env.OPENAI_API_KEY || fileProfile.openaiApiKey || "",
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || fileProfile.googleMapsApiKey || ""
  };
};


// Initialize databases if not exists
if (!fs.existsSync(HISTORY_PATH)) writeJsonFile(HISTORY_PATH, []);
if (!fs.existsSync(CAMPAIGNS_PATH)) writeJsonFile(CAMPAIGNS_PATH, []);
if (!fs.existsSync(INBOX_PATH)) writeJsonFile(INBOX_PATH, []);

const getFallbackLeads = (niche, location) => {
  const safeNiche = niche.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const safeLocation = location.toLowerCase().replace(/[^a-z]/g, '').slice(0, 12);
  return [
    { name: `Apex ${niche} Services`, url: `apex-${safeNiche}-demo.example.com`, issue: "outdated web page, missing automated client booking features", email: `info@apex-${safeNiche}.example.com`, phone: "(701) 555-0987" },
    { name: `Red River ${niche} Pro`, url: `red-river-${safeNiche}-demo.example.com`, issue: "missing conversational AI receptionist (no after-hours scheduling)", email: `sales@red-river-${safeNiche}.example.com`, phone: "(701) 555-6543" },
    { name: `${location} ${niche} Co`, url: `${safeLocation}-${safeNiche}-demo.example.com`, issue: "slow mobile website load times, lacks local schema optimization", email: `contact@${safeLocation}-${safeNiche}.example.com`, phone: "(701) 555-3344" }
  ];
};

// ──────────────────────────────────────────────────────────
// LIVE GOOGLE MAPS API SCRAPER
// ──────────────────────────────────────────────────────────
async function fetchGooglePlacesLeads(niche, location, apiKey, limit = 3) {
  if (!apiKey) {
    console.log("No Google Maps API Key found. Falling back to safe demo leads.");
    return getFallbackLeads(niche, location);
  }

  const query = encodeURIComponent(`${niche} in ${location}`);
  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${apiKey}`;

  console.log(`[Google Maps Scraper] Searching for: ${niche} in ${location}`);
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();

  if (searchData.status !== "OK") {
    throw new Error(`Google Places Search API Error: ${searchData.status} - ${searchData.error_message || ''}`);
  }

  const leads = [];
  const results = searchData.results.slice(0, limit + 2); // get a few extra in case some lack websites

  for (const place of results) {
    if (leads.length >= limit) break;

    // Fetch details to get website and phone number
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,website,formatted_phone_number&key=${apiKey}`;
    const detailsRes = await fetch(detailsUrl);
    const detailsData = await detailsRes.json();

    if (detailsData.status === "OK" && detailsData.result) {
      const details = detailsData.result;
      
      // We strongly prefer leads with websites so we can run PageSpeed audits
      const website = details.website || `${place.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
      const domain = website.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const phone = details.formatted_phone_number || "No phone listed";
      const email = `info@${domain}`;

      leads.push({
        name: details.name || place.name,
        url: domain,
        issue: "missing automated conversational AI receptionist and poor local SEO optimization",
        email: email,
        phone: phone
      });
    }
  }

  // Fallback if the scraper fails to find any leads (very rare)
  if (leads.length === 0) {
    throw new Error(`No local businesses found for ${niche} in ${location}. Try a different location.`);
  }

  return leads;
}


// SMTP Nodemailer Sender Helper
async function sendMailHelper(to, subject, body, profile) {
  const hasSmtp = profile.smtpHost && profile.smtpUser && profile.smtpPass;
  if (!hasSmtp) {
    console.log(`[SIMULATED MAIL] Sending to: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content:\n${body}`);
    return { success: true, simulated: true };
  }

  const transporter = nodemailer.createTransport({
    host: profile.smtpHost,
    port: parseInt(profile.smtpPort, 10) || 587,
    secure: profile.smtpPort === "465",
    auth: {
      user: profile.smtpUser,
      pass: profile.smtpPass
    }
  });

  const mailOptions = {
    from: profile.smtpSender || profile.smtpUser,
    to,
    subject,
    text: body
  };

  try {
    console.log(`Sending real SMTP email to ${to} via ${profile.smtpHost}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully: " + info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("SMTP Error sending email:", err.message);
    throw err;
  }
}

// ──────────────────────────────────────────────────────────
//  AI BRAIN — LLM Text Generator (Gemini → OpenAI → Fallback)
// ──────────────────────────────────────────────────────────
async function generateTextHelper(prompt, systemInstruction = "") {
  const profile = getProfile();

  // ── 1. Attempt Google Gemini 2.5 Flash ──
  if (profile.geminiApiKey) {
    try {
      console.log("[AI Brain] Using Gemini 2.5 Flash...");
      const body = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        systemInstruction: systemInstruction
          ? { parts: [{ text: systemInstruction }] }
          : undefined,
        generationConfig: { temperature: 0.85, maxOutputTokens: 1024 }
      };
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${profile.geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        }
      );
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errText}`);
      }
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        console.log("[AI Brain] Gemini response received successfully.");
        return text.trim();
      }
      throw new Error("Gemini returned empty response.");
    } catch (err) {
      console.warn("[AI Brain] Gemini failed, checking OpenAI fallback:", err.message);
    }
  }

  // ── 2. Attempt OpenAI GPT-4o-mini ──
  if (profile.openaiApiKey) {
    try {
      console.log("[AI Brain] Using OpenAI GPT-4o-mini...");
      const messages = [];
      if (systemInstruction) messages.push({ role: "system", content: systemInstruction });
      messages.push({ role: "user", content: prompt });

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${profile.openaiApiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          temperature: 0.85,
          max_tokens: 1024
        })
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI API error ${response.status}: ${errText}`);
      }
      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text) {
        console.log("[AI Brain] OpenAI response received successfully.");
        return text.trim();
      }
      throw new Error("OpenAI returned empty response.");
    } catch (err) {
      console.warn("[AI Brain] OpenAI failed, falling back to template mode:", err.message);
    }
  }

  // ── 3. No API keys or both failed — return null for template fallback ──
  console.log("[AI Brain] No active LLM keys configured. Using template fallback.");
  return null;
}

// Routes

app.get('/api/profile', (req, res) => {
  res.json(getProfile());
});

app.post('/api/profile', (req, res) => {
  const newProfile = req.body;
  if (!newProfile.name || !newProfile.techStack || !newProfile.pricingFormula) {
    return res.status(400).json({ error: "Missing required profile fields" });
  }
  writeJsonFile(PROFILE_PATH, newProfile);
  res.json({ success: true, profile: newProfile });
});

// Test SMTP connection endpoint
app.post('/api/profile/test-email', async (req, res) => {
  const profile = getProfile();
  if (!profile.smtpHost || !profile.smtpUser || !profile.smtpPass) {
    return res.status(400).json({ error: "SMTP host, user, and password must be set first in your profile." });
  }

  try {
    await sendMailHelper(
      profile.smtpUser,
      "PixelPrairie SMTP Test Connection",
      `Success! Your SMTP connection for ${profile.name} is configured correctly and ready to launch marketing agent autopilot campaigns.`,
      profile
    );
    res.json({ success: true, message: "Test email successfully sent to your address!" });
  } catch (err) {
    res.status(500).json({ error: `Connection check failed: ${err.message}` });
  }
});

// ElevenLabs Text-to-Speech proxy endpoint for natural female voice synthesis
app.post('/api/voice/tts', async (req, res) => {
  const { text } = req.body;
  const profile = getProfile();

  if (!profile.elevenlabsApiKey) {
    return res.status(400).json({ error: "ElevenLabs API Key must be configured in your profile to use neural TTS." });
  }

  // Voice ID: Rachel (21m00Tcm4TlvDq8ikWAM)
  const voiceId = "21m00Tcm4TlvDq8ikWAM"; 
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  try {
    console.log(`Piping ElevenLabs neural text-to-speech for: "${text.substring(0, 30)}..."`);
    const elResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': profile.elevenlabsApiKey
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.7,
          similarity_boost: 0.75
        }
      })
    });

    if (!elResponse.ok) {
      const errText = await elResponse.text();
      return res.status(elResponse.status).json({ error: `ElevenLabs returned an error: ${errText}` });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    const audioBuffer = await elResponse.arrayBuffer();
    res.send(Buffer.from(audioBuffer));
  } catch (err) {
    console.error("ElevenLabs TTS Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Outbound phone dialer endpoint
app.post('/api/voice/dial', async (req, res) => {
  const { toNumber, method, publicUrl } = req.body;
  const profile = getProfile();

  if (!toNumber) {
    return res.status(400).json({ error: "Destination phone number (toNumber) is required." });
  }

  // If ElevenLabs direct outbound call method is requested
  if (method === 'elevenlabs') {
    if (!profile.elevenlabsApiKey || !profile.elevenlabsAgentId) {
      return res.status(400).json({ error: "ElevenLabs API Key and Agent ID must be set in your profile." });
    }

    try {
      console.log(`Triggering ElevenLabs native outbound call to ${toNumber}...`);
      const payload = {
        agent_id: profile.elevenlabsAgentId,
        to_number: toNumber
      };
      
      // If the user configured an ElevenLabs phone number ID (e.g. PN...), use it
      if (profile.twilioNumber && (profile.twilioNumber.startsWith('pn_') || profile.twilioNumber.startsWith('PN'))) {
        payload.agent_phone_number_id = profile.twilioNumber;
      }

      const elResponse = await fetch('https://api.elevenlabs.io/v1/convai/twilio/outbound-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': profile.elevenlabsApiKey
        },
        body: JSON.stringify(payload)
      });

      const elData = await elResponse.json();
      if (!elResponse.ok) {
        throw new Error(elData.detail?.message || elData.message || JSON.stringify(elData));
      }

      return res.json({ success: true, message: "Outbound call successfully initiated via ElevenLabs!", details: elData });
    } catch (err) {
      console.error("ElevenLabs Outbound Call Error:", err.message);
      return res.status(500).json({ error: `ElevenLabs API Call failed: ${err.message}` });
    }
  }

  // If Twilio custom webhook method is requested
  if (method === 'twilio') {
    if (!profile.twilioSid || !profile.twilioAuthToken || !profile.twilioNumber) {
      return res.status(400).json({ error: "Twilio Account SID, Auth Token, and Twilio Phone Number must be set in your profile." });
    }
    if (!profile.elevenlabsAgentId) {
      return res.status(400).json({ error: "ElevenLabs Agent ID must be set in your profile." });
    }

    // Determine the TwiML webhook URL
    const callbackBase = publicUrl || `http://localhost:5000`;
    const twimlUrl = `${callbackBase}/api/voice/twiml?agent_id=${encodeURIComponent(profile.elevenlabsAgentId)}`;

    try {
      console.log(`Initiating Twilio custom call to ${toNumber} via ${profile.twilioNumber} with webhook ${twimlUrl}...`);
      
      const auth = Buffer.from(`${profile.twilioSid}:${profile.twilioAuthToken}`).toString('base64');
      const params = new URLSearchParams();
      params.append('To', toNumber);
      params.append('From', profile.twilioNumber);
      params.append('Url', twimlUrl);

      const twilioRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${profile.twilioSid}/Calls.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const twilioData = await twilioRes.json();
      if (!twilioRes.ok) {
        throw new Error(twilioData.message || JSON.stringify(twilioData));
      }

      return res.json({ success: true, message: "Outbound call successfully initiated via Twilio!", details: twilioData });
    } catch (err) {
      console.error("Twilio Call Trigger Error:", err.message);
      return res.status(500).json({ error: `Twilio API Call failed: ${err.message}` });
    }
  }

  return res.status(400).json({ error: "Invalid calling method specified. Choose 'elevenlabs' or 'twilio'." });
});

// TwiML callback route for Twilio custom calling
app.all('/api/voice/twiml', (req, res) => {
  const agentId = req.query.agent_id || req.body.agent_id;
  if (!agentId) {
    console.error("TwiML callback error: Missing agent_id parameter.");
    return res.status(400).send("Missing agent_id");
  }

  console.log(`Serving TwiML response for agent_id: ${agentId}`);
  res.type('text/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${encodeURIComponent(agentId)}" />
  </Connect>
</Response>`);
});

app.get('/api/history', (req, res) => {
  const history = readJsonFile(HISTORY_PATH, []);
  res.json(history);
});

app.post('/api/agents/run', (req, res) => {
  const { agentId, input } = req.body;
  if (!agentId || !input) {
    return res.status(400).json({ error: "Missing agentId or input" });
  }

  const profile = getProfile();

  try {
    const { logs, result } = runAgent(agentId, input, profile);

    const history = readJsonFile(HISTORY_PATH, []);
    const newRecord = {
      id: Math.random().toString(36).substring(2, 9),
      agentId,
      input,
      timestamp: new Date().toISOString(),
      result
    };
    history.unshift(newRecord);
    writeJsonFile(HISTORY_PATH, history);

    res.json({ logs, result, historyItem: newRecord });
  } catch (err) {
    console.error("Agent error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Autopilot Campaigns Routes
app.get('/api/campaigns', (req, res) => {
  const campaigns = readJsonFile(CAMPAIGNS_PATH, []);
  res.json(campaigns);
});

app.post('/api/campaigns', (req, res) => {
  const { niche, location, size } = req.body;
  if (!niche || !location || !size) {
    return res.status(400).json({ error: "Missing niche, location, or size" });
  }

  const campaigns = readJsonFile(CAMPAIGNS_PATH, []);
  const newCampaign = {
    id: Math.random().toString(36).substring(2, 9),
    niche,
    location,
    size: parseInt(size, 10),
    status: "searching",
    progress: 0,
    leads: [],
    timestamp: new Date().toISOString()
  };

  campaigns.unshift(newCampaign);
  writeJsonFile(CAMPAIGNS_PATH, campaigns);

  processCampaignAutopilot(newCampaign.id);

  res.status(201).json(newCampaign);
});

// Mock Pitch Sent -> Triggers background lead reply
app.post('/api/campaigns/:campaignId/leads/:leadId/send', async (req, res) => {
  const { campaignId, leadId } = req.params;
  const campaigns = readJsonFile(CAMPAIGNS_PATH, []);
  const cIndex = campaigns.findIndex(c => c.id === campaignId);

  if (cIndex === -1) {
    return res.status(404).json({ error: "Campaign not found" });
  }

  const leadIndex = campaigns[cIndex].leads.findIndex(l => l.id === leadId);
  if (leadIndex === -1) {
    return res.status(404).json({ error: "Lead not found" });
  }

  const lead = campaigns[cIndex].leads[leadIndex];
  const profile = getProfile();

  try {
    // Send the pitch email (real or mock)
    await sendMailHelper(lead.email, `Outreach: Customer bookings audit for ${lead.name}`, lead.pitch, profile);

    campaigns[cIndex].leads[leadIndex].status = "sent";
    writeJsonFile(CAMPAIGNS_PATH, campaigns);

    // Trigger simulated inbound email response in 5 seconds
    simulateInboundReply(campaigns[cIndex], campaigns[cIndex].leads[leadIndex]);

    res.json({ success: true, lead: campaigns[cIndex].leads[leadIndex] });
  } catch (err) {
    res.status(500).json({ error: `Failed to dispatch SMTP email: ${err.message}` });
  }
});

// Inbox Endpoints
app.get('/api/inbox', (req, res) => {
  const inbox = readJsonFile(INBOX_PATH, []);
  res.json(inbox);
});

app.post('/api/inbox/:id/reply', async (req, res) => {
  const { id } = req.params;
  const inbox = readJsonFile(INBOX_PATH, []);
  const messageIndex = inbox.findIndex(m => m.id === id);

  if (messageIndex === -1) {
    return res.status(404).json({ error: "Message not found" });
  }

  const message = inbox[messageIndex];
  const profile = getProfile();
  const objections = readJsonFile(OBJECTIONS_PATH, {});

  // Analyze objection category based on content keywords
  const content = message.content.toLowerCase();
  let category = "general";
  let tactics = [];

  if (content.includes("budget") || content.includes("cost") || content.includes("price") || content.includes("afford")) {
    category = "price";
    tactics = objections.price?.tactics || [];
  } else if (content.includes("robot") || content.includes("fake") || content.includes("latency") || content.includes("voice")) {
    category = "trust";
    tactics = objections.trust?.tactics || [];
  } else if (content.includes("already have") || content.includes("website") || content.includes("existing")) {
    category = "website";
    tactics = objections.website?.tactics || [];
  } else {
    tactics = ["Offer a quick demo call mapping a test number directly to their mobile to show immediate value."];
  }

  // Build agent thought logs
  const logs = [
    { type: "thought", message: `Parsing email reply from ${message.leadName}. Identified objection category: ${category.toUpperCase()}`, timestamp: new Date().toISOString() },
    { type: "action", message: `Querying objections database for "${category}" tactics...`, timestamp: new Date().toISOString() },
    { type: "observation", message: `Retrieved ${tactics.length} proven conversion tactics for this objection.`, timestamp: new Date().toISOString() },
    { type: "thought", message: `Generating personalized AI reply to overcome the "${category}" objection for ${message.leadName}.`, timestamp: new Date().toISOString() }
  ];

  // ── AI-Powered Reply Generation ──
  const replySystemPrompt = `You are Kuldeep Kataria, founder of ${profile.name}, a web and AI agency in Fargo, ND.
You are replying to a local business owner who responded to your cold pitch email. 
Your goal is to overcome their objection and get them to agree to a 10-minute call or demo.
Write a warm, confident, human reply. Do not use bullet points or headers — write as natural paragraphs.
End with: Best,\nKuldeep Kataria\n${profile.name}`;

  const replyUserPrompt = `A lead named "${message.leadName}" responded to your pitch email with the following message:

"${message.content}"

Their main objection type is: ${category.toUpperCase()}
Use these proven tactics to overcome it:
${tactics.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Write a personalized reply to overcome their "${category}" objection and schedule a meeting. 
Suggest Tuesday at 2:00 PM or Thursday at 10:00 AM CST. Keep it under 150 words and natural.`;

  let replyText = "";
  const aiReply = await generateTextHelper(replyUserPrompt, replySystemPrompt);

  if (aiReply) {
    replyText = aiReply;
    logs.push({ type: "observation", message: `AI Brain generated a personalized ${category} objection reply.`, timestamp: new Date().toISOString() });
  } else {
    // Template fallback
    if (category === "price") {
      replyText = `Hi ${message.leadName.split(' ')[0]},\n\nI completely understand that budget is top of mind right now. That's actually why we structure things differently at ${profile.name}.\n\nWe build a **free, live working demo** of your website or voice agent first, so you can test it and see the actual results before you pay us anything. If you don't see how it will bring you more bookings, we walk away and you owe nothing.\n\nI have slots open this **Tuesday at 2:00 PM** or **Thursday at 10:00 AM CST**. Just let me know if one of those works!\n\nBest,\nKuldeep Kataria\n${profile.name}`;
    } else if (category === "trust") {
      replyText = `Hi ${message.leadName.split(' ')[0]},\n\nThat's a very fair concern. A lot of AI voice bots sound robotic and turn customers off. That's why we use ElevenLabs' neural engine—it captures natural human tone, breathing, and has less than a 1-second delay, so customers feel like they are talking to a real receptionist.\n\nI would love to set up a quick **test number** mapped to your phone so you can dial in and speak to the AI agent yourself to test the realism.\n\nDoes **Tuesday at 2:00 PM** or **Thursday at 10:00 AM CST** work for you?\n\nBest,\nKuldeep Kataria\n${profile.name}`;
    } else {
      replyText = `Hi ${message.leadName.split(' ')[0]},\n\nThanks for getting back to me! The AI Voice Agent is actually built to connect as an **add-on** to your existing phone line rather than replacing your website, answering calls after-hours so you never miss another booking.\n\nI have times open this **Tuesday at 2:00 PM** or **Thursday at 10:00 AM CST**. Let me know which one works!\n\nBest,\nKuldeep Kataria\n${profile.name}`;
    }
    logs.push({ type: "observation", message: `Template fallback used (no LLM keys configured).`, timestamp: new Date().toISOString() });
  }

  inbox[messageIndex].status = "replied";
  inbox[messageIndex].reply = replyText;
  inbox[messageIndex].objectionCategory = category;
  inbox[messageIndex].tacticsUsed = tactics;
  inbox[messageIndex].aiGenerated = !!aiReply;
  writeJsonFile(INBOX_PATH, inbox);

  res.json({ logs, reply: replyText, category, tactics, aiGenerated: !!aiReply });
});

// Mark meeting booked
app.post('/api/inbox/:id/book', async (req, res) => {
  const { id } = req.params;
  const inbox = readJsonFile(INBOX_PATH, []);
  const messageIndex = inbox.findIndex(m => m.id === id);

  if (messageIndex === -1) {
    return res.status(404).json({ error: "Message not found" });
  }

  const message = inbox[messageIndex];
  const profile = getProfile();

  try {
    // Send the booking calendar reply email (real or mock)
    await sendMailHelper(message.leadEmail, `Re: Booking details with PixelPrairie`, message.reply, profile);

    inbox[messageIndex].status = "meeting_booked";
    writeJsonFile(INBOX_PATH, inbox);

    // Link back to campaign and update lead status
    const campaigns = readJsonFile(CAMPAIGNS_PATH, []);
    let updated = false;

    for (let i = 0; i < campaigns.length; i++) {
      const lIdx = campaigns[i].leads.findIndex(l => l.email === message.leadEmail);
      if (lIdx !== -1) {
        campaigns[i].leads[lIdx].meetingBooked = true;
        updated = true;
        break;
      }
    }

    if (updated) {
      writeJsonFile(CAMPAIGNS_PATH, campaigns);
    }

    res.json({ success: true, message: inbox[messageIndex] });
  } catch (err) {
    res.status(500).json({ error: `Failed to send booking SMTP email: ${err.message}` });
  }
});

// Simulation of Inbound Reply after email is mock sent
function simulateInboundReply(campaign, lead) {
  setTimeout(() => {
    const inbox = readJsonFile(INBOX_PATH, []);
    const exists = inbox.some(m => m.leadEmail === lead.email);
    if (exists) return; // avoid duplicate mock replies

    const replies = [
      {
        subject: `Re: Quick suggestion for ${lead.name} (re: customer booking improvements)`,
        content: `Hi Kuldeep, thanks for the audit. The page speed warning is concerning, but we already have a website booking portal. Also, does the voice bot sound like a robot? Salons need a personal touch.`,
        objectionType: "trust"
      },
      {
        subject: `Re: Customer bookings suggestion for ${lead.name}`,
        content: `Hi Kuldeep, this sounds interesting but we are a small local daycare and don't have the budget for custom software right now. How much does this setup cost?`,
        objectionType: "price"
      },
      {
        subject: `Re: Quick suggestion for ${lead.name}`,
        content: `Hi, we already have a website. Can this phone agent call customers or does it just answer? Also does it hook to our calendar?`,
        objectionType: "website"
      }
    ];

    // Select suitable reply based on niche
    let reply = replies[2];
    if (campaign.niche.toLowerCase().includes('salon')) reply = replies[0];
    else if (campaign.niche.toLowerCase().includes('child')) reply = replies[1];

    const newReply = {
      id: Math.random().toString(36).substring(2, 9),
      campaignId: campaign.id,
      leadId: lead.id,
      leadName: lead.name,
      leadEmail: lead.email,
      subject: reply.subject,
      content: reply.content,
      status: "unread", // unread | replied | meeting_booked
      timestamp: new Date().toISOString(),
      reply: "",
      objectionCategory: "",
      tacticsUsed: []
    };

    inbox.unshift(newReply);
    writeJsonFile(INBOX_PATH, inbox);
    console.log(`Mock reply created in inbox for lead ${lead.name}`);
  }, 5000); // 5 seconds delay
}

// Google PageSpeed Insights Auditor Helper
async function fetchPageSpeedStats(domain, apiKey) {
  let targetUrl = domain;
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }
  
  let apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&category=performance&strategy=mobile`;
  if (apiKey) {
    apiUrl += `&key=${apiKey}`;
  }
  
  try {
    console.log(`Querying Google PageSpeed API for ${targetUrl} (API Key: ${apiKey ? 'Yes' : 'No'})...`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000); // 12 seconds timeout
    
    const response = await fetch(apiUrl, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`Google API returned status ${response.status}`);
    }
    
    const data = await response.json();
    const scoreVal = data.lighthouseResult?.categories?.performance?.score;
    const score = scoreVal !== undefined ? Math.round(scoreVal * 100) : null;
    const fcp = data.lighthouseResult?.audits?.['first-contentful-paint']?.displayValue || null;
    
    if (score !== null && fcp !== null) {
      return {
        score,
        fcp,
        success: true
      };
    }
  } catch (err) {
    console.error(`PageSpeed audit failed for ${targetUrl}:`, err.message);
  }
  return { success: false };
}

// Autopilot Queue Background Processor
async function processCampaignAutopilot(campaignId) {
  console.log(`Starting autopilot processing for campaign ${campaignId}`);

  let campaigns = readJsonFile(CAMPAIGNS_PATH, []);
  let cIndex = campaigns.findIndex(c => c.id === campaignId);
  if (cIndex === -1) return;

  const campaign = campaigns[cIndex];
  const profile = getProfile();

  let leadPool = [];
  try {
    leadPool = await fetchGooglePlacesLeads(campaign.niche, campaign.location, profile.googleMapsApiKey, campaign.size);
  } catch (err) {
    console.error(`Failed to scrape live leads: ${err.message}`);
    // If scraper fails, mark campaign as failed so it doesn't hang
    campaigns = readJsonFile(CAMPAIGNS_PATH, []);
    cIndex = campaigns.findIndex(c => c.id === campaignId);
    if (cIndex !== -1) {
      campaigns[cIndex].status = "failed";
      campaigns[cIndex].progress = 0;
      writeJsonFile(CAMPAIGNS_PATH, campaigns);
    }
    return;
  }

  const selectedLeads = leadPool.slice(0, campaign.size).map(l => ({
    id: Math.random().toString(36).substring(2, 9),
    name: l.name,
    url: l.url,
    issue: l.issue,
    email: l.email,
    phone: l.phone,
    status: "discovered",
    pitch: "",
    meetingBooked: false
  }));

  campaigns = readJsonFile(CAMPAIGNS_PATH, []);
  cIndex = campaigns.findIndex(c => c.id === campaignId);
  if (cIndex !== -1) {
    campaigns[cIndex].status = "running";
    campaigns[cIndex].progress = 10;
    campaigns[cIndex].leads = selectedLeads;
    writeJsonFile(CAMPAIGNS_PATH, campaigns);
  }

  for (let i = 0; i < selectedLeads.length; i++) {
    const lead = selectedLeads[i];
    
    // Stage A: Auditing Lead via Google PageSpeed
    campaigns = readJsonFile(CAMPAIGNS_PATH, []);
    cIndex = campaigns.findIndex(c => c.id === campaignId);
    if (cIndex !== -1) {
      campaigns[cIndex].leads[i].status = "auditing";
      campaigns[cIndex].progress = Math.min(90, Math.floor(10 + (i * (90 / selectedLeads.length))));
      writeJsonFile(CAMPAIGNS_PATH, campaigns);
    }

    const auditResult = await fetchPageSpeedStats(lead.url, profile.googleApiKey);
    let issueText = lead.issue;
    
    if (auditResult.success) {
      issueText = `slow mobile load speed (Google Lighthouse Performance Score: ${auditResult.score}/100, page load time: ${auditResult.fcp})`;
    } else {
      console.log(`PageSpeed check skipped/failed. Using fallback local audit for ${lead.url}`);
    }

    // Stage B: Generating Pitch Email via AI Brain or Template Fallback
    const pitchSystemPrompt = `You are an expert B2B sales copywriter for ${profile.name}, a web and AI agency based in Fargo, ND. 
Your goal is to write highly personalized, value-first cold pitch emails to local businesses. 
Write in a friendly, professional, and conversational tone. Use specific details about the business's identified problem.
Format the output as a ready-to-send email starting with "Subject:" on the first line, followed by a blank line, then the email body.
Sign off with: Kuldeep Kataria, Founder, ${profile.name}.`;

    const pitchUserPrompt = `Write a cold pitch email for the following local business:
- Business Name: ${lead.name}
- Location: ${campaign.location}
- Industry/Niche: ${campaign.niche}
- Website: ${lead.url}
- Identified Problem: ${issueText}
- Our Tech Stack: ${profile.techStack}
- Our Pricing Approach: ${profile.pricingFormula}

The email should:
1. Reference their specific problem naturally
2. Explain how we solve it using our tech stack
3. Offer a free live working demo before any payment
4. Suggest a quick 10-minute coffee chat or call in ${campaign.location}
5. Be under 200 words and feel human-written, not generic`;

    let customPitch;
    const aiPitch = await generateTextHelper(pitchUserPrompt, pitchSystemPrompt);

    if (aiPitch) {
      // AI-generated pitch — wrap it in the standard markdown card format
      customPitch = `### 🎯 PixelPrairie Lead Audit & Pitch Proposal\n\n**Target Business:** ${lead.name}\n**Location:** ${campaign.location}\n**Identified Conversion Block:** ${issueText}\n\n---\n\n#### 📧 AI-Generated Personalized Pitch Email\n\n${aiPitch}`;
    } else {
      // Template fallback if no LLM keys configured
      const { result } = runAgent('outreach', `${campaign.location} - ${campaign.niche}`, profile);
      customPitch = result
        .replace(/Target Business: .*/g, `Target Business: ${lead.name}`)
        .replace(/Location: .*/g, `Location: ${campaign.location}`)
        .replace(/Identified Conversion Block: .*/g, `Identified Conversion Block: ${issueText}`)
        .replace(/Hi Team at .*,/g, `Hi Team at ${lead.name},`)
        .replace(/re: mobile customer booking/g, `re: customer booking improvements`)
        .replace(/costs you customers: \*\*.*\*\*/g, `costs you customers: **${issueText}**`);
    }

    campaigns = readJsonFile(CAMPAIGNS_PATH, []);
    cIndex = campaigns.findIndex(c => c.id === campaignId);
    if (cIndex !== -1) {
      campaigns[cIndex].leads[i].issue = issueText; // Save the real PageSpeed metrics!
      campaigns[cIndex].leads[i].status = "drafted";
      campaigns[cIndex].leads[i].pitch = customPitch;
      campaigns[cIndex].leads[i].aiGenerated = !!aiPitch; // flag: true = AI, false = template
      campaigns[cIndex].progress = Math.min(90, Math.floor(10 + ((i + 0.8) * (90 / selectedLeads.length))));
      writeJsonFile(CAMPAIGNS_PATH, campaigns);
    }
  }

  await new Promise(resolve => setTimeout(resolve, 1000));
  campaigns = readJsonFile(CAMPAIGNS_PATH, []);
  cIndex = campaigns.findIndex(c => c.id === campaignId);
  if (cIndex !== -1) {
    campaigns[cIndex].status = "completed";
    campaigns[cIndex].progress = 100;
    writeJsonFile(CAMPAIGNS_PATH, campaigns);
  }
}

// Fallback route to serve built index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(frontendDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend build not found. Please compile frontend assets.');
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
