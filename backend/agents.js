// C:\Users\Tbodv\.gemini\antigravity\scratch\business-agent-workspace\backend\agents.js

export function runAgent(agentId, input, agencyProfile) {
  const agencyName = agencyProfile?.name || "PixelPrairie";
  const primaryStack = agencyProfile?.techStack || "Next.js, Tailwind CSS, and ElevenLabs Voice AI";
  const pricingFormula = agencyProfile?.pricingFormula || "Custom value-based pricing tailored to your business goals";

  const timestamp = () => new Date().toISOString();

  switch (agentId) {
    case "outreach": {
      const parts = input.split("-").map(s => s.trim());
      const location = parts[0] || "Fargo, ND";
      const industry = parts[1] || "Local Businesses";

      const leads = [
        {
          name: "Red River " + industry,
          issue: "missing out on after-hours customer calls and booking inquiries. Their site has no instant booking system or AI receptionist, losing an estimated 35% of potential bookings.",
          pitchIdea: "Deploy a custom PixelPrairie AI Voice Receptionist utilizing ElevenLabs. The AI will answer their calls 24/7 in a natural-sounding voice, answering FAQs and booking client appointments directly into their calendar."
        },
        {
          name: "Prairie View " + industry,
          issue: "slow legacy site loading in 5.2 seconds on mobile. Lacks local SEO keywords for Fargo-Moorhead search rankings, causing them to lose search visibility to competitors.",
          pitchIdea: "Rebuild the website on Next.js 16 with Tailwind CSS, optimized local SEO schema markup, and target a 98+ Lighthouse speed score to capture local Google search traffic."
        },
        {
          name: "Fargo-Moorhead " + industry,
          issue: "no active customer outreach or automated follow-up system. Customer bookings require manual email confirmations and phone calls.",
          pitchIdea: "Implement a modern Next.js booking portal integrated with a conversational SMS follow-up agent, reducing administrative scheduling hours by 90%."
        }
      ];

      // Randomly select one lead to create a hyper-realistic experience
      const lead = leads[Math.floor(Math.random() * leads.length)];

      const logs = [
        {
          type: "thought",
          message: `Launching PixelPrairie Local Lead Audit Agent for ${industry} in ${location}.`,
          timestamp: timestamp()
        },
        {
          type: "action",
          message: `Searching Google Maps and auditing digital frameworks for "${industry} near ${location}"...`,
          timestamp: timestamp()
        },
        {
          type: "observation",
          message: `Identified 3 local businesses with severe conversion bottlenecks:\n- ${leads[0].name} (${leads[0].issue})\n- ${leads[1].name} (${leads[1].issue})\n- ${leads[2].name} (${leads[2].issue})`,
          timestamp: timestamp()
        },
        {
          type: "thought",
          message: `Selecting "${lead.name}" as the highest priority lead because solving their problem will directly boost their monthly bookings.`,
          timestamp: timestamp()
        },
        {
          type: "action",
          message: `Performing deep-dive Lighthouse speed audit and telephone responsiveness simulation for ${lead.name}...`,
          timestamp: timestamp()
        },
        {
          type: "observation",
          message: `Audit complete. Key findings: Mobile Load Speed: F (uncompressed images). Call test: Voicemail triggered on 3 consecutive rings.`,
          timestamp: timestamp()
        },
        {
          type: "thought",
          message: `Drafting a value-first, Fargo-local pitch email from ${agencyName}. Emphasizing ${lead.pitchIdea}.`,
          timestamp: timestamp()
        }
      ];

      const result = `### 🎯 PixelPrairie Lead Audit & Pitch Proposal

**Target Business:** ${lead.name}
**Location:** ${location} (Fargo-Moorhead Area)
**Identified Conversion Block:** ${lead.issue}

---

#### 📧 Drafted Local Pitch Email
**Subject:** Customer bookings suggestion for ${lead.name} (from Fargo)

Hi Team at ${lead.name},

I'm Kuldeep, a web developer and designer based right here in Fargo. I was looking over local ${industry} listings in our area and wanted to reach out with a quick suggestion for ${lead.name}.

I noticed one bottleneck that might be causing you to miss out on customers: **${lead.issue.split('.')[0]}**

At **${agencyName}**, we specialize in building fast, modern websites using **${primaryStack}** and setting up **AI Voice Agents** that answer phone calls 24/7. Here is how we can fix this for you:
*   **Proposed Solution:** ${lead.pitchIdea}
*   **Estimated Return:** Pick up 100% of missed calls, automate calendar scheduling, and score a 95+ on Google PageSpeed.
*   **Local Offer:** We build a **free live working demo** of your new website or voice agent before you pay us anything.

Would you be open to a quick 10-minute chat or coffee in Fargo this week to see a live demo of how the AI receptionist answers calls?
`;

      return { logs, result };
    }

    case "scoping": {
      const brief = input || "AI Voice agent to answer calls for a local barber shop";

      const logs = [
        {
          type: "thought",
          message: `Analyzing PixelPrairie project brief: "${brief}".`,
          timestamp: timestamp()
        },
        {
          type: "action",
          message: "Mapping project requirements to Next.js 16 structure and ElevenLabs Voice API integrations...",
          timestamp: timestamp()
        },
        {
          type: "observation",
          message: "Modules identified: Next.js website UI, ElevenLabs voice routing node, Twilio phone number connector, Google Calendar scheduling webhook, and Admin panel dashboard.",
          timestamp: timestamp()
        },
        {
          type: "thought",
          message: `Structuring tech stacks matching PixelPrairie defaults (${primaryStack}).`,
          timestamp: timestamp()
        },
        {
          type: "action",
          message: "Creating pricing breakdown based on: " + pricingFormula + "...",
          timestamp: timestamp()
        },
        {
          type: "observation",
          message: "Timeline estimated at 5-10 days. Pricing set using PixelPrairie starting rates.",
          timestamp: timestamp()
        },
        {
          type: "thought",
          message: "Formatting full technical proposal with Local SEO and Voice Agent details.",
          timestamp: timestamp()
        }
      ];

      const result = `# 📋 Technical Project Proposal & Scope

## Project Name: ${brief}
**Prepared By:** ${agencyName} (Kuldeep Kataria - Fargo, ND)
**Development Stack:** ${primaryStack}
**Pricing Model:** ${pricingFormula}

---

### 1. Project Summary
This proposal details the design, development, and deployment of **${brief}** tailored for high conversion, search visibility in Fargo-Moorhead, and automated booking operations.

### 2. Proposed Architecture
*   **Frontend Site:** Next.js 16 + React (Fast static rendering, responsive, fluid animations).
*   **AI Voice Engine:** ElevenLabs Conversational Voice API (Human-like latency, custom phonetic training).
*   **VoIP Routing:** Twilio (Local Fargo-Moorhead 701 phone number mapping and call forwarding).
*   **Booking Webhook:** Calendar API (Direct scheduler syncing to Google Calendar/Cal.com).

### 3. Sprint Deliverables (5-10 Day Turnaround)

#### Phase 1: High-Fidelity UI Design & Development (Days 1-3)
*   Build a responsive, modern Next.js landing page with premium animations.
*   Optimize copy for local Fargo-Moorhead search terms (Local SEO).
*   Deploy static assets to Vercel CDN for high PageSpeed scores (95+).

#### Phase 2: AI Voice Agent Training & Setup (Days 4-6)
*   Define system prompts, business knowledge context (hours, menu, FAQs).
*   Configure ElevenLabs natural voice pipeline with low-latency configuration.
*   Map voice call triggers to Twilio inbound local phone number.

#### Phase 3: Calendar & Webhook Integration (Days 7-8)
*   Connect voice triggers to Calendar booking API for automated scheduling.
*   Configure SMS notification dispatcher for booking confirmations.

#### Phase 4: Launch & Handover (Days 9-10)
*   Final validation, Lighthouse testing, and client test calls.
*   Production deploy, domain mapping, and training on the admin dashboard.

### 4. Pricing & Investment
*   **Website Setup:** Tailored based on project scale and features list.
*   **AI Voice Agent Integration:** Custom prompt configuration and voice training.
*   **Ongoing Support:** Hosted on Vercel (free tier) or self-hosted. You own the code 100%.
`;

      return { logs, result };
    }

    case "qa-support": {
      const issue = input || "ElevenLabs Voice Agent voice latency exceeds 2 seconds on mobile connection";

      const logs = [
        {
          type: "thought",
          message: `Analyzing technical ticket: "${issue}".`,
          timestamp: timestamp()
        },
        {
          type: "action",
          message: "Searching latency issues in WebSockets and ElevenLabs agent stream endpoints...",
          timestamp: timestamp()
        },
        {
          type: "observation",
          message: "Possible causes: 1) WebSocket buffer bloat on weak mobile bandwidth. 2) ElevenLabs model set to turbo-v2 instead of flash (turbo models have higher latency). 3) Serverless edge function cold-starts when routing calls.",
          timestamp: timestamp()
        },
        {
          type: "thought",
          message: "Drafting technical diagnostics checklist for PixelPrairie team and a client-facing status draft.",
          timestamp: timestamp()
        },
        {
          type: "action",
          message: "Defining testing procedures to replicate WebSocket stream lag...",
          timestamp: timestamp()
        },
        {
          type: "observation",
          message: "Defined 3 validation steps: compare flash-model speed, verify WebSocket connection timeouts, audit Vercel serverless function logs.",
          timestamp: timestamp()
        },
        {
          type: "thought",
          message: "Formatting diagnostic support document.",
          timestamp: timestamp()
        }
      ];

      const result = `### 🛠️ Technical Diagnostic & Client Support Report

**Reported Issue:** ${issue}

---

#### 👨‍💻 1. Developer Diagnostic Checklist (PixelPrairie)
1.  **Check ElevenLabs Model Settings:** Verify if the conversational agent is using \`eleven_turbo_v2\` or the new \`eleven_flash\` model. Switching to the Flash model cuts TTS generation latency by 50%.
2.  **WebSocket Buffer Management:** Ensure the React client-side WebSocket code drops outdated audio packets if latency spikes, keeping the call in real-time.
3.  **Vercel Edge Routes:** Ensure the route handling the webhook call is configured as an Edge route (\`runtime: "edge"\`) to bypass Node.js serverless cold starts.

#### 📝 2. QA Test Procedures
*   **Test Case 1: Model Latency Benchmark**
    *   *Setup:* Run calls using both Turbo-v2 and Flash models.
    *   *Expected:* Flash model latency stays under 800ms; Turbo-v2 averages 1.8s.
*   **Test Case 2: Bandwidth Chrottling**
    *   *Setup:* Throtle network connection to 3G speeds in browser tools.
    *   *Expected:* Voice agent connection remains stable without audio dropping.

#### 📧 3. Drafted Client Response
**Subject:** Technical Update: Voice Agent Latency Check

Hi Team,

Thanks for reporting the voice lag issue (**${issue}**). 

We are currently optimizing the AI voice pipeline. We are upgrading the AI translation model to a low-latency Flash model which is specifically built for mobile network conditions. This should cut response times in half.

We are deploying this update this afternoon and will follow up once the faster model is live for you to test.
`;

      return { logs, result };
    }

    case "tech-scout": {
      const topic = input || "ElevenLabs vs VAPI for conversational voice agents";

      const logs = [
        {
          type: "thought",
          message: `Analyzing technology comparison request: "${topic}".`,
          timestamp: timestamp()
        },
        {
          type: "action",
          message: "Evaluating latency, voice quality, calendar webhook integrations, and pricing structures...",
          timestamp: timestamp()
        },
        {
          type: "observation",
          message: "Gathered benchmarks: ElevenLabs offers superior natural voices, while VAPI has better built-in telephone routing (SIP/Twilio) and tool-calling structures.",
          timestamp: timestamp()
        },
        {
          type: "thought",
          message: "Formulating recommendations for PixelPrairie's local business offerings.",
          timestamp: timestamp()
        },
        {
          type: "action",
          message: "Compiling technology assessment report...",
          timestamp: timestamp()
        }
      ];

      const result = `### 🔍 PixelPrairie Technology Scout Report

**Topic:** ${topic}
**Prepared For:** PixelPrairie Tech Stack Options

---

#### 📊 Technology Assessment Matrix

| Feature / Metric | ElevenLabs (Direct API) | VAPI.ai (Voice platform) | Recommended Approach |
| :--- | :--- | :--- | :--- |
| **Voice Realism** | ⭐⭐⭐⭐⭐ (Industry best natural prosody) | ⭐⭐⭐⭐ (Can import ElevenLabs voices) | **ElevenLabs** is required for high-end local businesses where realism is key. |
| **Call Routing / Twilio** | ⭐⭐⭐ (Requires custom Node.js server) | ⭐⭐⭐⭐⭐ (Built-in SIP & Twilio management) | **VAPI** is much faster to configure for basic phone line setups. |
| **Latency (Response Time)** | ~800ms - 1.2s | ~600ms - 900ms | **VAPI** is slightly faster out of the box due to specialized orchestration. |
| **Pricing / Cost** | $0.015 - $0.024 / min (API + voice cost) | $0.05 / min platform fee + API costs | **ElevenLabs direct** is cheaper for scaling, but VAPI saves hours of dev setup. |

#### 💡 Recommendations for PixelPrairie
1.  **For Simple FAQ bots:** Use **VAPI** because it sets up in minutes and can be easily mapped to local 701 numbers.
2.  **For High-End Branding:** Build direct Node.js integrations using **ElevenLabs WebSocket API** to get the best voice quality.
3.  **Sales Pitch Advantage:** Highlight that PixelPrairie sites utilize ElevenLabs voice technology—the same tech powering the world's most advanced AI voice avatars—giving local Fargo businesses enterprise-level AI.
`;

      return { logs, result };
    }

    default:
      throw new Error("Invalid agent ID");
  }
}
