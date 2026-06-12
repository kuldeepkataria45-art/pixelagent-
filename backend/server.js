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
    googleApiKey: process.env.GOOGLE_API_KEY || fileProfile.googleApiKey || ""
  };
};

// Initialize databases if not exists
if (!fs.existsSync(HISTORY_PATH)) writeJsonFile(HISTORY_PATH, []);
if (!fs.existsSync(CAMPAIGNS_PATH)) writeJsonFile(CAMPAIGNS_PATH, []);
if (!fs.existsSync(INBOX_PATH)) writeJsonFile(INBOX_PATH, []);

// Local Fargo-Moorhead Business Leads Database
const localBusinessDB = {
  salon: [
    { name: "Velourra Salon", url: "velourrasalon.com", issue: "no online booking widget, slow mobile website (5.2s load speed)", email: "contact@velourrasalon.com", phone: "(701) 555-4029" },
    { name: "Hair Atelier", url: "hairatelierfargo.com", issue: "missing conversational AI phone receptionist (calls go to voicemail)", email: "info@hairatelierfargo.com", phone: "(701) 555-9831" },
    { name: "Red River Barber Co", url: "redriverbarber.com", issue: "outdated site from 2016, lacks parent/customer text alerts", email: "bookings@redriverbarber.com", phone: "(701) 555-1234" },
    { name: "Apex Hair Studio", url: "apexhairfargo.com", issue: "no mobile booking app, poor local SEO keyword mapping", email: "hello@apexhairfargo.com", phone: "(701) 555-8765" }
  ],
  childcare: [
    { name: "Creative Nest Childcare", url: "creativenestchildcare.com", issue: "broken contact form, slow mobile rendering (6.1s)", email: "director@creativenest.com", phone: "(701) 555-2244" },
    { name: "Fargo Daycare Pros", url: "fargodaycarepros.com", issue: "no automated SMS check-ins or parent voice bot", email: "fargodaycare@gmail.com", phone: "(701) 555-7799" },
    { name: "Moorhead Early Academy", url: "moorheadearlyacademy.org", issue: "missing Google map integration, legacy layout", email: "academy@moorheadearly.org", phone: "(218) 555-3300" }
  ],
  landscaping: [
    { name: "Red River Lawn & Snow", url: "redriverlawnfargo.com", issue: "no instant quoting form, site not mobile responsive", email: "office@redriverlawnfargo.com", phone: "(701) 555-1155" },
    { name: "Moorhead Greenery", url: "moorheadgreenery.com", issue: "missing phone receptionist (voicemail triggers constantly)", email: "info@moorheadgreenery.com", phone: "(218) 555-6677" },
    { name: "Fargo Turf Care", url: "fargoturf.com", issue: "legacy site built on old Drupal version, page load speed 4.9s", email: "service@fargoturf.com", phone: "(701) 555-9090" }
  ]
};

const getFallbackLeads = (niche, location) => {
  return [
    { name: `Apex ${niche} Services`, url: `apex${niche.toLowerCase().replace(/\s+/g, '')}.com`, issue: "outdated web page, missing automated client booking features", email: `info@apex${niche.toLowerCase().replace(/\s+/g, '')}.com`, phone: "(701) 555-0987" },
    { name: `Red River ${niche} Pro`, url: `redriver${niche.toLowerCase().replace(/\s+/g, '')}.com`, issue: "missing conversational AI receptionist (no after-hours scheduling)", email: `sales@redriver${niche.toLowerCase().replace(/\s+/g, '')}.com`, phone: "(701) 555-6543" },
    { name: `${location} ${niche} Co`, url: `${location.toLowerCase().replace(/[^a-z]/g, '')}${niche.toLowerCase().replace(/\s+/g, '')}.com`, issue: "slow mobile website load times, lacks local schema optimization", email: `contact@${location.toLowerCase().replace(/[^a-z]/g, '')}${niche.toLowerCase().replace(/\s+/g, '')}.com`, phone: "(701) 555-3344" }
  ];
};

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

app.post('/api/inbox/:id/reply', (req, res) => {
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

  // Generate the smart objection response using iPhone-specific calendar options
  const logs = [
    { type: "thought", message: `Parsing email reply from ${message.leadName}. Identified objection category: ${category.toUpperCase()}`, timestamp: new Date().toISOString() },
    { type: "action", message: `Querying objections.json database for "${category}" tactics...`, timestamp: new Date().toISOString() },
    { type: "observation", message: `Retrieved tactics: ${JSON.stringify(tactics)}`, timestamp: new Date().toISOString() },
    { type: "thought", message: `Drafting iPhone Calendar Invite invitation reply. Customizing proposal to bypass ${category} obstacle.`, timestamp: new Date().toISOString() }
  ];

  let replyText = "";
  if (category === "price") {
    replyText = `Hi ${message.leadName.split(' ')[0]},\n\nI completely understand that budget is top of mind right now. That's actually why we structure things differently at PixelPrairie.\n\nWe build a **free, live working demo** of your website or voice agent first, so you can test it and see the actual results before you pay us anything. If you don't see how it will bring you more bookings, we walk away and you owe nothing.\n\nSince I manage my calendar on my iPhone, I can send a calendar invite directly to your email so it pops up in your schedule. I have slots open this **Tuesday at 2:00 PM** or **Thursday at 10:00 AM CST**. Just let me know if one of those works, and I will send over the invite!\n\nBest,\nKuldeep Kataria\nPixelPrairie`;
  } else if (category === "trust") {
    replyText = `Hi ${message.leadName.split(' ')[0]},\n\nThat's a very fair concern. A lot of AI voice bots sound robotic and turn customers off. That's why we use ElevenLabs' neural engine—it captures natural human tone, breathing, and has less than a 1-second delay, so customers feel like they are talking to a real receptionist.\n\nI would love to set up a quick **test number** mapped to your phone so you can dial in and speak to the AI agent yourself to test the realism. \n\nI can send a direct invitation from my iPhone calendar to your inbox for a quick 10-minute check. Does **Tuesday at 2:00 PM** or **Thursday at 10:00 AM CST** work for you? Just let me know your email and I'll send it over.\n\nBest,\nKuldeep Kataria\nPixelPrairie`;
  } else {
    replyText = `Hi ${message.leadName.split(' ')[0]},\n\nThanks for getting back to me! I completely understand you already have a site. The AI Voice Agent is actually built to connect as an **add-on** to your existing phone line rather than replacing your website, answering calls after-hours so you never miss another booking.\n\nI can send a calendar invitation directly to your inbox so we can do a quick 10-minute walkthrough. I have times open this **Tuesday at 2:00 PM** or **Thursday at 10:00 AM CST**. Let me know which one works and I'll send it straight to your calendar!\n\nBest,\nKuldeep Kataria\nPixelPrairie`;
  }

  inbox[messageIndex].status = "replied";
  inbox[messageIndex].reply = replyText;
  inbox[messageIndex].objectionCategory = category;
  inbox[messageIndex].tacticsUsed = tactics;
  writeJsonFile(INBOX_PATH, inbox);

  res.json({ logs, reply: replyText, category, tactics });
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

  const normalizedNiche = campaign.niche.toLowerCase();
  let leadPool = [];
  if (normalizedNiche.includes('salon') || normalizedNiche.includes('hair') || normalizedNiche.includes('barber')) {
    leadPool = localBusinessDB.salon;
  } else if (normalizedNiche.includes('child') || normalizedNiche.includes('daycare') || normalizedNiche.includes('nursery')) {
    leadPool = localBusinessDB.childcare;
  } else if (normalizedNiche.includes('landscap') || normalizedNiche.includes('lawn') || normalizedNiche.includes('garden')) {
    leadPool = localBusinessDB.landscaping;
  } else {
    leadPool = getFallbackLeads(campaign.niche, campaign.location);
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

    // Stage B: Generating Pitch Email
    const { result } = runAgent('outreach', `${campaign.location} - ${campaign.niche}`, profile);

    const customPitch = result
      .replace(/Target Business: .*/g, `Target Business: ${lead.name}`)
      .replace(/Location: .*/g, `Location: ${campaign.location}`)
      .replace(/Identified Conversion Block: .*/g, `Identified Conversion Block: ${issueText}`)
      .replace(/Hi Team at .*,/g, `Hi Team at ${lead.name},`)
      .replace(/re: mobile customer booking/g, `re: customer booking improvements`)
      .replace(/costs you customers: \*\*.*\*\*/g, `costs you customers: **${issueText}**`);

    campaigns = readJsonFile(CAMPAIGNS_PATH, []);
    cIndex = campaigns.findIndex(c => c.id === campaignId);
    if (cIndex !== -1) {
      campaigns[cIndex].leads[i].issue = issueText; // Save the real PageSpeed metrics!
      campaigns[cIndex].leads[i].status = "drafted";
      campaigns[cIndex].leads[i].pitch = customPitch;
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
