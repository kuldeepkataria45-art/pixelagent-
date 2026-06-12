// C:\Users\Tbodv\.gemini\antigravity\scratch\business-agent-workspace\frontend\src\App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Conversation } from '@elevenlabs/client';

// Custom lightweight Markdown-to-HTML parser
const renderMarkdown = (text) => {
  if (!text) return '';
  const lines = text.split('\n');
  let inTable = false;
  let tableHeaders = [];
  let html = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Tables
    if (line.startsWith('|')) {
      const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      if (line.includes('---')) {
        continue;
      }
      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
        html.push('<div class="table-wrapper"><table><thead><tr>');
        cells.forEach(c => html.push(`<th>${c}</th>`));
        html.push('</tr></thead><tbody>');
      } else {
        html.push('<tr>');
        cells.forEach(c => html.push(`<td>${c}</td>`));
        html.push('</tr>');
      }
      continue;
    } else if (inTable) {
      inTable = false;
      html.push('</tbody></table></div>');
    }

    // Headings
    if (line.startsWith('# ')) {
      html.push(`<h1>${line.replace('# ', '')}</h1>`);
    } else if (line.startsWith('## ')) {
      html.push(`<h2>${line.replace('## ', '')}</h2>`);
    } else if (line.startsWith('### ')) {
      html.push(`<h3>${line.replace('### ', '')}</h3>`);
    } else if (line.startsWith('#### ')) {
      html.push(`<h4>${line.replace('#### ', '')}</h4>`);
    } 
    // Horizontal Rule
    else if (line === '---') {
      html.push('<hr />');
    }
    // Bullet Points
    else if (line.startsWith('* ') || line.startsWith('- ')) {
      html.push(`<ul><li>${line.substring(2)}</li></ul>`);
    }
    // Bold / Strong parsing
    else if (line) {
      let formattedLine = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
      html.push(`<p>${formattedLine}</p>`);
    } else {
      html.push('<br />');
    }
  }
  if (inTable) {
    html.push('</tbody></table></div>');
  }
  return html.join('');
};

// 3D Specular Cursor-tracking Card
function Hover3DCard({ children, className = '', style = {}, onClick }) {
  const cardRef = React.useRef(null);
  const [mouseCoords, setMouseCoords] = React.useState({ x: 0, y: 0 });
  const [tilt, setTilt] = React.useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const normX = (x / rect.width) - 0.5;
    const normY = (y / rect.height) - 0.5;

    const maxRotate = 4; // degrees
    setTilt({
      x: -normY * maxRotate,
      y: normX * maxRotate
    });
    setMouseCoords({ x, y });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div 
      ref={cardRef}
      className={`cyber-panel ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        ...style,
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        '--mouse-x': `${mouseCoords.x}px`,
        '--mouse-y': `${mouseCoords.y}px`
      }}
    >
      <div className="specular-glow" />
      <div className="cyber-bracket bracket-tl" />
      <div className="cyber-bracket bracket-tr" />
      <div className="cyber-bracket bracket-bl" />
      <div className="cyber-bracket bracket-br" />
      {children}
    </div>
  );
}

// Parse Google PageSpeed scores
const extractScoreAndLoadTime = (issueText) => {
  if (!issueText) return { score: null, time: null };
  const scoreMatch = issueText.match(/Score:\s*(\d+)/i) || issueText.match(/Score\s*(\d+)/i);
  const timeMatch = issueText.match(/(\d+\.?\d*)\s*s/i) || issueText.match(/load\s*time:\s*(\d+\.?\d*)/i);
  
  let score = null;
  if (scoreMatch) {
    score = parseInt(scoreMatch[1], 10);
  } else if (timeMatch) {
    const timeVal = parseFloat(timeMatch[1]);
    if (timeVal < 2) score = 92;
    else if (timeVal < 3.5) score = 76;
    else if (timeVal < 5) score = 51;
    else score = 38;
  }
  
  const time = timeMatch ? `${timeMatch[1]}s` : null;
  return { score, time };
};

// Diagnostic Gauge Component
function PageSpeedGauge({ score, time }) {
  if (score === null) return null;
  const strokeDashoffset = 125.66 - (score / 100) * 125.66;
  
  let gradeClass = "gauge-fast";
  if (score < 50) gradeClass = "gauge-slow";
  else if (score < 80) gradeClass = "gauge-average";
  
  return (
    <div className="pagespeed-gauge-container">
      <svg className="pagespeed-gauge-svg" viewBox="0 0 50 50">
        <circle className="gauge-bg-circle" cx="25" cy="25" r="20" />
        <circle 
          className={`gauge-fill-circle ${gradeClass}`} 
          cx="25" 
          cy="25" 
          r="20" 
          strokeDasharray="125.66" 
          strokeDashoffset={strokeDashoffset} 
        />
      </svg>
      <div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Mobile Speed Performance
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'white', fontFamily: 'var(--font-mono)' }}>
            {score}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>/ 100</span>
          {time && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px', border: '1px solid rgba(255,255,255,0.04)', fontFamily: 'var(--font-mono)' }}>
              FCP: {time}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ROI Calculator Slider Widget
function RoiCalculator() {
  const [emailsMonth, setEmailsMonth] = useState(120);
  const [conversionRate, setConversionRate] = useState(5.0);
  const [dealValue, setDealValue] = useState(1200);

  const totalBooked = Math.round((emailsMonth * (conversionRate / 100)));
  const monthlyRevenue = totalBooked * dealValue;
  const yearlyRevenue = monthlyRevenue * 12;

  return (
    <div className="cyber-panel roi-widget-card" style={{ marginBottom: '32px', overflow: 'hidden' }}>
      <div className="specular-glow" />
      <div className="cyber-bracket bracket-tl" />
      <div className="cyber-bracket bracket-tr" />
      <div className="cyber-bracket bracket-bl" />
      <div className="cyber-bracket bracket-br" />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '12px', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📊 PixelPrairie Autonomous ROI Simulator
          </h3>
          <p className="section-desc" style={{ marginTop: '2px' }}>Estimate value saved by capturing after-hours calls and resolving email objections.</p>
        </div>
        <span className="badge" style={{ borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}>Value Simulator</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <label style={{ fontWeight: '600' }}>Outreach Leads / Month</label>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>{emailsMonth} leads</span>
            </div>
            <input 
              type="range" 
              min="20" 
              max="500" 
              step="10"
              value={emailsMonth} 
              onChange={e => setEmailsMonth(parseInt(e.target.value))}
              className="cyber-range-input"
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <label style={{ fontWeight: '600' }}>AI Booking Conversion Rate</label>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>{conversionRate.toFixed(1)}%</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="20" 
              step="0.5"
              value={conversionRate} 
              onChange={e => setConversionRate(parseFloat(e.target.value))}
              className="cyber-range-input"
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <label style={{ fontWeight: '600' }}>Average Value per Booked Client</label>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>${dealValue}</span>
            </div>
            <input 
              type="range" 
              min="200" 
              max="5000" 
              step="100"
              value={dealValue} 
              onChange={e => setDealValue(parseInt(e.target.value))}
              className="cyber-range-input"
            />
          </div>
        </div>

        <div className="roi-metrics-flex" style={{ borderTop: 'none', paddingTop: '0', marginTop: '0' }}>
          <div className="roi-sub-metric" style={{ background: 'rgba(0,242,254,0.02)', borderColor: 'rgba(0,242,254,0.1)' }}>
            <div className="roi-sub-label">Estimated Bookings / Mo</div>
            <div className="roi-sub-val highlight-neon" style={{ fontSize: '2rem' }}>{totalBooked}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>Recovered clients</div>
          </div>
          
          <div className="roi-sub-metric" style={{ background: 'rgba(139,92,246,0.02)', borderColor: 'rgba(139,92,246,0.1)' }}>
            <div className="roi-sub-label">Value Reclaimed / Yr</div>
            <div className="roi-sub-val" style={{ fontSize: '2rem', color: 'var(--accent-purple)', textShadow: '0 0 10px rgba(139,92,246,0.2)' }}>
              ${yearlyRevenue.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              ${monthlyRevenue.toLocaleString()} / mo saved
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profile, setProfile] = useState({ name: 'PixelPrairie', techStack: '', pricingFormula: '', smtpHost: '', smtpPort: '587', smtpUser: '', smtpPass: '', smtpSender: '', twilioSid: '', twilioAuthToken: '', twilioNumber: '', elevenlabsApiKey: '', elevenlabsAgentId: '', geminiApiKey: '', openaiApiKey: '', googleMapsApiKey: '' });
  const [history, setHistory] = useState([]);

  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  // Profile Edit State
  const [profileForm, setProfileForm] = useState({ name: '', techStack: '', pricingFormula: '', smtpHost: '', smtpPort: '587', smtpUser: '', smtpPass: '', smtpSender: '', twilioSid: '', twilioAuthToken: '', twilioNumber: '', elevenlabsApiKey: '', elevenlabsAgentId: '', geminiApiKey: '', openaiApiKey: '', googleMapsApiKey: '' });
  const [saveStatus, setSaveStatus] = useState(null);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [testSmtpStatus, setTestSmtpStatus] = useState(null);
  const [testSmtpError, setTestSmtpError] = useState('');

  // Voice Sandbox state hooks
  const [simStatus, setSimStatus] = useState('idle');
  const [simTranscript, setSimTranscript] = useState([]);
  const [simSpeaker, setSimSpeaker] = useState('');
  const [webCallStatus, setWebCallStatus] = useState('disconnected');
  const [dialPhone, setDialPhone] = useState('+17014046442');
  const [dialMethod, setDialMethod] = useState('elevenlabs');
  const [dialStatus, setDialStatus] = useState(null);
  const [dialError, setDialError] = useState('');
  const [publicServerUrl, setPublicServerUrl] = useState('');

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const conversationRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const playingAudioRef = useRef(null);

  // Selected Agent Room State
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentInput, setAgentInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [agentLogs, setAgentLogs] = useState([]);
  const [agentResult, setAgentResult] = useState('');
  const [currentLogIndex, setCurrentLogIndex] = useState(-1);
  const logTimerRef = useRef(null);

  const consoleEndRef = useRef(null);
  const inboxConsoleEndRef = useRef(null);

  // Autopilot Campaigns State
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [newCampaign, setNewCampaign] = useState({ niche: 'Hair Salon', location: 'Fargo, ND', size: '3', autoSend: false });
  const [expandedLeadId, setExpandedLeadId] = useState(null);
  const [campaignCreating, setCampaignCreating] = useState(false);

  // Inbox Replies State
  const [inboxMessages, setInboxMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isAnalyzingReply, setIsAnalyzingReply] = useState(false);

  // Cyber styling simulation states
  const [sidebarStats, setSidebarStats] = useState({ threads: 3, cpu: 28, mem: '14.2 GB' });
  const [isSilenceAlertActive, setIsSilenceAlertActive] = useState(false);
  const [useElevenLabsTts, setUseElevenLabsTts] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSidebarStats({
        threads: Math.floor(Math.random() * 3) + 2,
        cpu: Math.floor(Math.random() * 20) + 15,
        mem: (Math.random() * 0.4 + 14.1).toFixed(1) + ' GB'
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);
  const [inboxLogs, setInboxLogs] = useState([]);
  const [inboxResult, setInboxResult] = useState('');
  const [objectionCategory, setObjectionCategory] = useState('');
  const [tacticsUsed, setTacticsUsed] = useState([]);
  const inboxTimerRef = useRef(null);

  const agentsList = [
    {
      id: 'outreach',
      name: 'Agency Sales Outreach',
      description: 'Audit local business sites in a niche and draft tailored app/website pitch proposals.',
      inputLabel: 'Target Industry & Location',
      placeholder: 'e.g., Dentists - Austin, TX or Auto Repair - Chicago, IL',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="icon">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
        </svg>
      )
    },
    {
      id: 'scoping',
      name: 'Project Scoping & Proposal',
      description: 'Generate structural requirements, tech stacks, sprint roadmaps, and pricing models for client ideas.',
      inputLabel: 'Client Application Idea Brief',
      placeholder: 'e.g., Airbnb for boat rentals, or SaaS metrics dashboard for dentists',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="icon">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-.621-.504-1.125-1.125-1.125H9.75M8.25 21h8.25c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H8.25c-.621 0-1.125.504-1.125 1.125v14.25c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      )
    },
    {
      id: 'qa-support',
      name: 'QA & Technical Client Support',
      description: 'Diagnose reported bug descriptions, create regression test cases, and draft client-friendly updates.',
      inputLabel: 'Bug Report / Technical Complaint',
      placeholder: 'e.g., Customers receive 500 error when clicking checkout, database hangs',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="icon">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l-5.877 5.877A2.652 2.652 0 011.8 17.25l5.878-5.877M11.42 15.17L12 9h6M12 9l5.877-5.877A2.652 2.652 0 0014.25 1L8.37 6.88M12 9l-6 6" />
        </svg>
      )
    },
    {
      id: 'tech-scout',
      name: 'Technology Scout & Benchmark',
      description: 'Analyze, benchmark, and compare emerging technology stacks, frameworks, and APIs for developer teams.',
      inputLabel: 'Topic or Stack to Investigate',
      placeholder: 'e.g., Next.js vs SvelteKit for high-traffic sites, or Firecrawl for LLM scraping',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="icon">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.86m-18 0h18" />
        </svg>
      )
    }
  ];

  // Fetch Profile, History, Campaigns, Inbox on mount
  useEffect(() => {
    fetchProfile();
    fetchHistory();
    fetchCampaigns();
    fetchInbox();
  }, []);

  // Poll Campaigns and Inbox when campaign runs
  useEffect(() => {
    const hasRunning = campaigns.some(c => c.status === 'running' || c.status === 'searching');
    let timer;
    if (hasRunning) {
      timer = setInterval(() => {
        fetchCampaigns();
        fetchInbox();
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [campaigns]);

  // Keep selected campaign/inbox sync with polled data
  useEffect(() => {
    if (selectedCampaign) {
      const updated = campaigns.find(c => c.id === selectedCampaign.id);
      if (updated) setSelectedCampaign(updated);
    }
  }, [campaigns, selectedCampaign]);

  useEffect(() => {
    if (selectedMessage) {
      const updated = inboxMessages.find(m => m.id === selectedMessage.id);
      if (updated) setSelectedMessage(updated);
    }
  }, [inboxMessages, selectedMessage]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        if (!data.error) {
          setProfile(data);
          setProfileForm(data);
        }
      }
    } catch (e) {
      console.error("Error fetching profile", e);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      setHistory(data);
    } catch (e) {
      console.error("Error fetching history", e);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      setCampaigns(data);
    } catch (e) {
      console.error("Error fetching campaigns", e);
    }
  };

  const fetchInbox = async () => {
    try {
      const res = await fetch('/api/inbox');
      const data = await res.json();
      setInboxMessages(data);
    } catch (e) {
      console.error("Error fetching inbox", e);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setSaveStatus('success');
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    }
  };

  const handleClearAllData = async () => {
    if (!window.confirm("Are you sure you want to delete all campaigns, inbox replies, and history? This cannot be undone.")) return;
    try {
      await fetch('/api/campaigns', { method: 'DELETE' });
      await fetch('/api/inbox', { method: 'DELETE' });
      await fetch('/api/history', { method: 'DELETE' });
      fetchCampaigns();
      fetchInbox();
      fetchHistory();
      setSelectedCampaign(null);
      setSelectedMessage(null);
    } catch (err) {
      console.error("Failed to delete data:", err);
    }
  };

  const resetSilenceTimer = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      handleSilenceTrigger();
    }, 9000); // 9 seconds of silence trigger
  };

  const handleSilenceTrigger = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    
    const prompts = [
      "Hello? Are you still there?",
      "Just checking in, did you want me to send a calendar invite to your iPhone?",
      "Are you there? Let me know if you want to test the voice agent some more."
    ];
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

    setIsSilenceAlertActive(true);
    setSimTranscript(prev => [...prev, { sender: 'agent', text: randomPrompt }]);
    speakText(randomPrompt, () => {
      setTimeout(startSpeechRecognition, 300);
      resetSilenceTimer();
    });
  };

  const speakLocalBrowserText = (text, onEnd) => {
    if (!synthRef.current) return;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (playingAudioRef.current) {
      playingAudioRef.current.pause();
      playingAudioRef.current = null;
    }
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synthRef.current.getVoices();
    // Prioritize high-quality professional female voices
    const femaleVoice = voices.find(v => 
      v.name.includes('Google US English') || 
      v.name.includes('Zira') || 
      v.name.includes('Samantha') || 
      v.name.includes('Hazel') || 
      v.name.includes('Susan') || 
      (v.lang.startsWith('en') && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('woman') || v.name.toLowerCase().includes('girl')))
    ) || voices.find(v => v.lang.startsWith('en'));

    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    utterance.onstart = () => {
      setSimSpeaker('agent');
    };
    utterance.onend = () => {
      setSimSpeaker('');
      if (onEnd) onEnd();
    };
    utterance.onerror = (e) => {
      console.error("Speech Synthesis Error:", e);
      setSimSpeaker('');
      if (onEnd) onEnd();
    };
    synthRef.current.speak(utterance);
  };

  const speakElevenLabsText = async (text, onEnd) => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (synthRef.current) synthRef.current.cancel();
    if (playingAudioRef.current) {
      playingAudioRef.current.pause();
      playingAudioRef.current = null;
    }
    setSimSpeaker('agent');

    let audio = null;
    try {
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!res.ok) {
        throw new Error("TTS proxy request failed");
      }

      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      audio = new Audio(audioUrl);
      playingAudioRef.current = audio;

      audio.onended = () => {
        playingAudioRef.current = null;
        setSimSpeaker('');
        if (onEnd) onEnd();
      };

      audio.onerror = (e) => {
        console.error("Audio playback error, falling back to local voice:", e);
        playingAudioRef.current = null;
        setSimSpeaker('');
        speakLocalBrowserText(text, onEnd);
      };

      audio.play();
    } catch (err) {
      console.error("ElevenLabs TTS failed, falling back to local browser voice:", err);
      if (audio && playingAudioRef.current === audio) {
        playingAudioRef.current = null;
      }
      speakLocalBrowserText(text, onEnd);
    }
  };

  const speakText = (text, onEnd) => {
    if (useElevenLabsTts && profile.elevenlabsApiKey) {
      speakElevenLabsText(text, onEnd);
    } else {
      speakLocalBrowserText(text, onEnd);
    }
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSimTranscript(prev => [...prev, { sender: 'system', text: "Speech recognition not supported in this browser. Please use Chrome/Edge." }]);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setSimSpeaker('user');
    };

    rec.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      setIsSilenceAlertActive(false);
      setSimTranscript(prev => [...prev, { sender: 'user', text: speechToText }]);
      setSimSpeaker('');
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      handleUserSpeech(speechToText);
    };

    rec.onerror = (e) => {
      console.error("Speech Recognition Error:", e);
      setSimSpeaker('');
      if (simStatus === 'connected' && e.error === 'no-speech') {
        setTimeout(startSpeechRecognition, 500);
      }
    };

    rec.onend = () => {
      if (simStatus === 'connected' && simSpeaker === '') {
        setTimeout(() => {
          if (simStatus === 'connected' && simSpeaker === '') {
            try { rec.start(); } catch (err) {}
          }
        }, 300);
      }
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUserSpeech = (text) => {
    const query = text.toLowerCase();
    let reply = "";
    
    // Objections & Price
    if (query.includes('price') || query.includes('cost') || query.includes('budget') || query.includes('money') || query.includes('expensive') || query.includes('charge')) {
      reply = `I completely understand that budget is top of mind. At ${profile.name || 'PixelPrairie'}, we actually build a free, live working demo of your website or voice receptionist first. You get to test it and see real results before you pay us anything. Would you like me to send a calendar invitation to your email for a quick 10-minute demo this Tuesday at 2:00 PM?`;
    } 
    // Realism & Voice quality
    else if (query.includes('robot') || query.includes('fake') || query.includes('human') || query.includes('real') || query.includes('voice') || query.includes('robotic')) {
      reply = `That's a very fair concern. Many bots sound robotic and turn customers off. That's why we use ElevenLabs' state-of-the-art neural engine—it captures natural human tone, inflections, breathing, and has less than a 1-second delay so customers feel like they are talking to a real receptionist. I can send an invitation directly to your iPhone calendar so we can do a live phone test. Does Tuesday at 2:00 PM work?`;
    } 
    // Existing Setup / Website
    else if (query.includes('already have') || query.includes('website') || query.includes('exist') || query.includes('site')) {
      reply = `I understand you already have a website! Our AI Voice agent is actually built to connect as an add-on to your phone line rather than replacing your site, answering calls after-hours so you never miss another customer booking. I can send an invitation directly to your calendar to show you how. Does Tuesday at 2:00 PM or Thursday at 10:00 AM CST work?`;
    } 
    // Who is this? / Creator FAQ
    else if (query.includes('who is this') || query.includes('who are you') || query.includes('your name') || query.includes('who built you') || query.includes('who made you')) {
      reply = `I am the AI assistant for ${profile.name || 'PixelPrairie'}. Kuldeep Kataria built me to demonstrate how low-latency ElevenLabs conversational voice agents can help local Fargo-Moorhead businesses automate call bookings. Would you like to schedule a quick 10-minute walkthrough this Tuesday at 2:00 PM?`;
    } 
    // How does it work? / Twilio FAQ
    else if (query.includes('how does it work') || query.includes('how do you work') || query.includes('twilio') || query.includes('setup') || query.includes('how to connect')) {
      reply = `It's very simple! We map a local Fargo-Moorhead 701 number via Twilio directly to your ElevenLabs voice receptionist. When a customer dials, the AI answers instantly, handles bookings, and syncs them directly to your calendar. Would you like to schedule a 10-minute call this Tuesday at 2:00 PM to see a live demo?`;
    } 
    // Niches served / Fargo
    else if (query.includes('niche') || query.includes('industry') || query.includes('fargo') || query.includes('salon') || query.includes('daycare') || query.includes('landscap') || query.includes('lawn')) {
      reply = `We specialize in local Fargo-Moorhead services, including hair salons, childcare academies, and landscaping/snow removal services. I can simulate typical bookings for any of these! Would you like me to send a calendar invite for a quick 10-minute review this Tuesday at 2:00 PM?`;
    } 
    // Timeline / How long does it take
    else if (query.includes('timeline') || query.includes('how long') || query.includes('days') || query.includes('duration') || query.includes('time to build')) {
      reply = `We can design, configure, and launch your custom website and ElevenLabs voice agent in just 5 to 7 days, including prompt training tailored for your specific business. I can send an invitation to your calendar to discuss your timeline. Would Tuesday at 2:00 PM work?`;
    } 
    // Services / Features
    else if (query.includes('service') || query.includes('feature') || query.includes('what can you do') || query.includes('capabilities')) {
      reply = `Our AI agents can answer common business FAQs, book client appointments, send automated parent check-ins or booking text alerts, and sync everything directly to your iPhone calendar. Would you be open to a quick 10-minute chat this Tuesday at 2:00 PM to see it?`;
    }
    // Calendar integrations
    else if (query.includes('calendar') || query.includes('schedule') || query.includes('appointment') || query.includes('book')) {
      reply = `I have openings for a quick 10-minute walkthrough this Tuesday at 2:00 PM or Thursday at 10:00 AM CST. Which one works best to send a calendar invite directly to your iPhone calendar?`;
    }
    // Confirmed booking (Yes)
    else if (query.includes('yes') || query.includes('sure') || query.includes('work') || query.includes('book') || query.includes('tuesday') || query.includes('thursday') || query.includes('calendar') || query.includes('invite') || query.includes('ok') || query.includes('fine') || query.includes('sounds good')) {
      const selectedTime = query.includes('thursday') ? 'Thursday at 10:00 AM CST' : 'Tuesday at 2:00 PM CST';
      reply = `Perfect! I've booked your 10-minute AI walkthrough for ${selectedTime}. I am sending a calendar invitation directly to your inbox that will sync to your iPhone calendar. Looking forward to showing you the demo! Have a wonderful day!`;
      
      setTimeout(() => {
        speakText(reply, () => {
          setSimTranscript(prev => [...prev, { sender: 'agent', text: reply }]);
          setSimTranscript(prev => [...prev, { sender: 'system', text: `Call ended. Meeting booked for ${selectedTime} and synced to iPhone Calendar.` }]);
          setSimStatus('idle');
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
        });
      }, 500);
      return;
    } 
    // Rejected booking (No)
    else if (query.includes('no') || query.includes('bye') || query.includes('stop') || query.includes('hang up') || query.includes('cancel') || query.includes('exit')) {
      reply = `No problem at all! If you ever want to see how a low-latency AI receptionist can help PixelPrairie grow, feel free to call back. Have a great day!`;
      setTimeout(() => {
        speakText(reply, () => {
          setSimTranscript(prev => [...prev, { sender: 'agent', text: reply }]);
          setSimStatus('idle');
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
        });
      }, 500);
      return;
    } 
    // Fallback response
    else {
      reply = `At ${profile.name || 'PixelPrairie'}, we build custom Next.js websites and low-latency ElevenLabs conversational voice agents. We build a free, live working demo of your new setup before you pay us anything. Would you like me to send an iPhone calendar invitation for a 10-minute chat this Tuesday at 2:00 PM?`;
    }

    setSimTranscript(prev => [...prev, { sender: 'agent', text: reply }]);
    speakText(reply, () => {
      setTimeout(startSpeechRecognition, 300);
      resetSilenceTimer();
    });
  };

  const startSimCall = () => {
    setIsSilenceAlertActive(false);
    setSimStatus('calling');
    setSimTranscript([{ sender: 'system', text: "Dialing PixelPrairie AI Assistant..." }]);
    
    setTimeout(() => {
      setSimStatus('ringing');
      setSimTranscript(prev => [...prev, { sender: 'system', text: "Ringing..." }]);
      
      setTimeout(() => {
        setSimStatus('connected');
        setSimTranscript(prev => [...prev, { sender: 'system', text: "Connected." }]);
        
        const intro = "Hi! Thank you for calling PixelPrairie's AI receptionist simulator. I'm an AI voice assistant helping local Fargo-Moorhead businesses capture after-hours bookings and handle customer queries. How can I help you today?";
        setSimTranscript(prev => [...prev, { sender: 'agent', text: intro }]);
        speakText(intro, () => {
          startSpeechRecognition();
          resetSilenceTimer();
        });
      }, 1500);
    }, 1500);
  };

  const hangUpSimCall = () => {
    setIsSilenceAlertActive(false);
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    if (playingAudioRef.current) {
      playingAudioRef.current.pause();
      playingAudioRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    setSimStatus('idle');
    setSimSpeaker('');
    setSimTranscript(prev => [...prev, { sender: 'system', text: "Call disconnected." }]);
  };

  const startRealWebCall = async () => {
    if (!profile.elevenlabsApiKey || !profile.elevenlabsAgentId) {
      alert("Please configure your ElevenLabs API Key and Agent ID in the Sandbox settings or Agency Profile first.");
      return;
    }

    setWebCallStatus('connecting');

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const conversation = await Conversation.startSession({
        agentId: profile.elevenlabsAgentId,
        onConnect: () => {
          setWebCallStatus('connected');
        },
        onDisconnect: () => {
          setWebCallStatus('disconnected');
        },
        onError: (error) => {
          console.error("ElevenLabs SDK Error:", error);
          setWebCallStatus('error');
        },
        onMessage: (message) => {
          console.log("ElevenLabs SDK Message:", message);
        }
      });

      conversationRef.current = conversation;
    } catch (err) {
      console.error("Failed to start WebRTC conversation:", err);
      setWebCallStatus('error');
      alert(`Could not start voice session: ${err.message}`);
    }
  };

  const endRealWebCall = async () => {
    if (conversationRef.current) {
      await conversationRef.current.endSession();
      conversationRef.current = null;
    }
    setWebCallStatus('disconnected');
  };

  const handlePhoneDial = async () => {
    setDialStatus('calling');
    setDialError('');
    try {
      const res = await fetch('/api/voice/dial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toNumber: dialPhone,
          method: dialMethod,
          publicUrl: publicServerUrl
        })
      });
      const data = await res.json();
      if (res.ok) {
        setDialStatus('success');
      } else {
        setDialStatus('error');
        setDialError(data.error || 'Failed to initiate outbound call.');
      }
    } catch (err) {
      console.error(err);
      setDialStatus('error');
      setDialError(err.message || 'Network error triggering call.');
    }
  };

  const handleTestSmtpConnection = async () => {
    setIsTestingSmtp(true);
    setTestSmtpStatus(null);
    setTestSmtpError('');
    try {
      const saveRes = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      });
      if (!saveRes.ok) {
        throw new Error("Failed to save profile settings before testing");
      }
      
      const res = await fetch('/api/profile/test-email', {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        setTestSmtpStatus('success');
        fetchProfile();
      } else {
        setTestSmtpStatus('error');
        setTestSmtpError(data.error || 'Unknown error occurred.');
      }
    } catch (err) {
      console.error(err);
      setTestSmtpStatus('error');
      setTestSmtpError(err.message || 'Network error connecting to backend.');
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const handleRunAgent = async () => {
    if (!agentInput.trim()) return;

    setIsRunning(true);
    setAgentLogs([]);
    setAgentResult('');
    setCurrentLogIndex(-1);

    try {
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: selectedAgent.id, input: agentInput })
      });
      const data = await res.json();

      if (data.error) {
        setAgentLogs([{ type: 'error', message: data.error, timestamp: new Date().toISOString() }]);
        setIsRunning(false);
        return;
      }

      let index = 0;
      const streamLogs = () => {
        if (index < data.logs.length) {
          setAgentLogs(prev => [...prev, data.logs[index]]);
          index++;
          setTimeout(() => {
            if (consoleEndRef.current) {
              consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
          }, 50);
          logTimerRef.current = setTimeout(streamLogs, 1500);
        } else {
          setAgentResult(data.result);
          setIsRunning(false);
          fetchHistory();
        }
      };

      streamLogs();

    } catch (err) {
      console.error(err);
      setAgentLogs([{ type: 'error', message: 'Connection to Agent backend failed.', timestamp: new Date().toISOString() }]);
      setIsRunning(false);
    }
  };

  // Launch Autopilot Campaign
  const handleLaunchCampaign = async (e) => {
    e.preventDefault();
    setCampaignCreating(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCampaign)
      });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(prev => [data, ...prev]);
        setSelectedCampaign(data);
        setActiveTab('autopilot');
      }
    } catch (err) {
      console.error("Error creating campaign", err);
    } finally {
      setCampaignCreating(false);
    }
  };

  // Send Pitch Email (Autopilot mode)
  const handleSendPitch = async (campaignId, leadId) => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/leads/${leadId}/send`, {
        method: 'POST'
      });
      if (res.ok) {
        setCampaigns(prev => {
          return prev.map(c => {
            if (c.id === campaignId) {
              return {
                ...c,
                leads: c.leads.map(l => (l.id === leadId ? { ...l, status: 'sent' } : l))
              };
            }
            return c;
          });
        });
        setTimeout(fetchInbox, 6000); // fetch replies after 6 seconds
      }
    } catch (err) {
      console.error("Error sending pitch", err);
    }
  };

  // Generate Smart Objection Reply (Inbox mode)
  const handleGenerateSmartReply = async () => {
    if (!selectedMessage) return;

    setIsAnalyzingReply(true);
    setInboxLogs([]);
    setInboxResult('');

    try {
      const res = await fetch(`/api/inbox/${selectedMessage.id}/reply`, {
        method: 'POST'
      });
      const data = await res.json();

      if (data.error) {
        setInboxLogs([{ type: 'error', message: data.error, timestamp: new Date().toISOString() }]);
        setIsAnalyzingReply(false);
        return;
      }

      let index = 0;
      const streamInboxLogs = () => {
        if (index < data.logs.length) {
          setInboxLogs(prev => [...prev, data.logs[index]]);
          index++;
          setTimeout(() => {
            if (inboxConsoleEndRef.current) {
              inboxConsoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
          }, 50);
          inboxTimerRef.current = setTimeout(streamInboxLogs, 1500);
        } else {
          setInboxResult(data.reply);
          setObjectionCategory(data.category);
          setTacticsUsed(data.tactics);
          setIsAnalyzingReply(false);
          fetchInbox();
        }
      };

      streamInboxLogs();

    } catch (err) {
      console.error(err);
      setInboxLogs([{ type: 'error', message: 'Objection solver failed.', timestamp: new Date().toISOString() }]);
      setIsAnalyzingReply(false);
    }
  };

  // Book meeting and sync to iPhone Calendar invitation
  const handleBookMeeting = async () => {
    if (!selectedMessage) return;

    try {
      const res = await fetch(`/api/inbox/${selectedMessage.id}/book`, {
        method: 'POST'
      });
      if (res.ok) {
        fetchInbox();
        fetchCampaigns();
        alert("Meeting Booked! Calendar invitation has been drafted to send straight to your iPhone calendar.");
      }
    } catch (err) {
      console.error("Error booking meeting", err);
    }
  };

  useEffect(() => {
    return () => {
      if (inboxTimerRef.current) clearTimeout(inboxTimerRef.current);
    };
  }, []);

  return (
    <>
      {/* CRT scanlines and 3D space backdrop */}
      <div className="crt-overlay" />
      <div className="cyber-grid-backdrop">
        <div className="cyber-grid-floor" />
      </div>

      <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo-section">
          <div className="logo-glow"></div>
          <span className="logo-icon">🍃</span>
          <div>
            <h3>{profile.name}</h3>
            <span className="badge">Agent Control Hub</span>
          </div>
        </div>

        <nav className="nav-menu">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveTab('dashboard'); setSelectedAgent(null); setSelectedCampaign(null); setSelectedMessage(null); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            Dashboard
          </button>
          <button 
            className={`nav-item ${activeTab === 'agents' || selectedAgent ? 'active' : ''}`}
            onClick={() => { setActiveTab('agents'); setSelectedCampaign(null); setSelectedMessage(null); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
            </svg>
            Agent Command
          </button>
          <button 
            className={`nav-item ${activeTab === 'autopilot' || selectedCampaign ? 'active' : ''}`}
            onClick={() => { setActiveTab('autopilot'); setSelectedAgent(null); setSelectedMessage(null); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 8.38m5.96 5.99c-.96.96-2.5 1.13-3.47.38L8 12.5m-3 3l2-2.5" />
            </svg>
            Autopilot Campaigns
          </button>
          <button 
            className={`nav-item ${activeTab === 'inbox' || selectedMessage ? 'active' : ''}`}
            onClick={() => { setActiveTab('inbox'); setSelectedAgent(null); setSelectedCampaign(null); }}
          >
            <div style={{ position: 'relative' }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="icon">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              {inboxMessages.some(m => m.status === 'unread') && <span className="inbox-alert-dot"></span>}
            </div>
            Inbox Replies
          </button>
          <button 
            className={`nav-item ${activeTab === 'voice-sandbox' ? 'active' : ''}`}
            onClick={() => { setActiveTab('voice-sandbox'); setSelectedAgent(null); setSelectedCampaign(null); setSelectedMessage(null); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            Voice Call Sandbox
          </button>
          <button 
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => { setActiveTab('profile'); setSelectedAgent(null); setSelectedCampaign(null); setSelectedMessage(null); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Agency Profile
          </button>
          <button 
            className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => { setActiveTab('history'); setSelectedAgent(null); setSelectedCampaign(null); setSelectedMessage(null); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            Run History
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-monitor">
            <div className="monitor-header">
              <span>System Core</span>
              <span>Online</span>
            </div>
            <div className="monitor-item">
              <span className="monitor-label">Scraper Threads</span>
              <span className="monitor-value">{sidebarStats.threads} / 8</span>
            </div>
            <div className="monitor-bar-container">
              <div className="monitor-bar" style={{ width: `${(sidebarStats.threads / 8) * 100}%` }}></div>
            </div>
            <div className="monitor-item" style={{ marginTop: '4px' }}>
              <span className="monitor-label">CPU core</span>
              <span className="monitor-value">{sidebarStats.cpu}%</span>
            </div>
            <div className="monitor-bar-container">
              <div className="monitor-bar" style={{ width: `${sidebarStats.cpu}%`, background: 'var(--accent-purple)' }}></div>
            </div>
            <div className="monitor-item" style={{ marginTop: '4px' }}>
              <span className="monitor-label">System RAM</span>
              <span className="monitor-value">{sidebarStats.mem}</span>
            </div>
          </div>
          <div className="status-container">
            <span className="status-dot"></span>
            <span>Agent Engine Active</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="main-header glass-panel">
          <h2>
            {activeTab === 'dashboard' && 'Dashboard Overview'}
            {activeTab === 'profile' && 'Agency Configuration'}
            {activeTab === 'agents' && (selectedAgent ? selectedAgent.name : 'Agent Command Center')}
            {activeTab === 'autopilot' && (selectedCampaign ? `Autopilot: ${selectedCampaign.niche}` : 'Marketing Autopilot Campaigns')}
            {activeTab === 'inbox' && (selectedMessage ? `Replier: ${selectedMessage.leadName}` : 'Lead Response Inbox')}
            {activeTab === 'history' && 'Run History Archive'}
            {activeTab === 'voice-sandbox' && 'AI Voice Call Sandbox'}
          </h2>
          <div className="header-meta">
            {activeTab === 'dashboard' && (
              <button 
                className="btn-secondary btn-sm" 
                style={{ borderColor: 'var(--accent-pink)', color: 'var(--accent-pink)', marginRight: '1rem' }}
                onClick={handleClearAllData}
              >
                Wipe All Test Data
              </button>
            )}
            <div className="meta-badge">{(profile && profile.techStack) ? profile.techStack.split(',')[0] : 'Next.js 16'}</div>
          </div>
        </header>

        <section className="content-body">
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="tab-dashboard fade-in">
              <div className="metrics-grid">
                <Hover3DCard className="metric-card">
                  <span className="metric-label">Active Campaigns</span>
                  <h2 className="metric-value">{campaigns.length}</h2>
                  <p className="metric-meta">Running fully on autopilot</p>
                </Hover3DCard>
                <Hover3DCard className="metric-card">
                  <span className="metric-label">Total Leads Found</span>
                  <h2 className="metric-value">
                    {campaigns.reduce((sum, c) => sum + (c.leads?.length || 0), 0)}
                  </h2>
                  <p className="metric-meta">Local Fargo-Moorhead leads</p>
                </Hover3DCard>
                <Hover3DCard className="metric-card">
                  <span className="metric-label">Meetings Booked</span>
                  <h2 className="metric-value" style={{ color: 'var(--accent-green)', textShadow: '0 0 10px var(--accent-green-glow)' }}>
                    {inboxMessages.filter(m => m.status === 'meeting_booked').length}
                  </h2>
                  <p className="metric-meta">Synced to iPhone calendar</p>
                </Hover3DCard>
                <Hover3DCard className="metric-card">
                  <span className="metric-label">Unread Replies</span>
                  <h2 className="metric-value" style={{ color: inboxMessages.some(m => m.status === 'unread') ? 'var(--accent-pink)' : 'white', textShadow: inboxMessages.some(m => m.status === 'unread') ? '0 0 10px var(--accent-pink-glow)' : 'none' }}>
                    {inboxMessages.filter(m => m.status === 'unread').length}
                  </h2>
                  <p className="metric-meta">Objections ready for AI solver</p>
                </Hover3DCard>
              </div>

              {/* ROI Calculator simulator */}
              <RoiCalculator />

              <div className="dashboard-grid">
                {/* Agent Quick Links */}
                <Hover3DCard className="dashboard-card">
                  <h3>Marketing Campaigns</h3>
                  <p className="section-desc">Launch background lead filters directly targeting local markets.</p>
                  <div className="quick-agent-list">
                    <div className="quick-agent-item" onClick={() => setActiveTab('autopilot')}>
                      <div className="item-icon-wrapper">🚀</div>
                      <div>
                        <h4>Launch Autopilot Campaign</h4>
                        <span className="quick-meta">Ready to generate leads</span>
                      </div>
                    </div>
                    {campaigns.slice(0, 3).map(c => (
                      <div key={c.id} className="quick-agent-item" onClick={() => { setSelectedCampaign(c); setActiveTab('autopilot'); }}>
                        <div className="item-icon-wrapper">📂</div>
                        <div>
                          <h4>{c.niche} ({c.location})</h4>
                          <span className="quick-meta" style={{ color: c.status === 'completed' ? 'var(--accent-green)' : 'var(--accent-cyan)' }}>
                            {c.status.toUpperCase()} — {c.progress}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Hover3DCard>

                {/* Recent Inbox Replies */}
                <Hover3DCard className="dashboard-card">
                  <h3>Inbound Lead Replies</h3>
                  <p className="section-desc">Replies from Fargo-Moorhead owners needing objection solving.</p>
                  <div className="recent-history-list">
                    {inboxMessages.slice(0, 3).map(msg => (
                      <div 
                        key={msg.id} 
                        className="history-list-item"
                        style={{ cursor: 'pointer' }}
                        onClick={() => { setSelectedMessage(msg); setInboxResult(msg.reply || ''); setObjectionCategory(msg.objectionCategory || ''); setTacticsUsed(msg.tacticsUsed || []); setActiveTab('inbox'); }}
                      >
                        <div className="h-item-header">
                          <span className="h-item-name">{msg.leadName}</span>
                          <span className={`c-status-badge status-${msg.status === 'meeting_booked' ? 'completed' : msg.status === 'replied' ? 'running' : 'searching'}`}>
                            {msg.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="h-item-query" style={{ color: 'white', fontWeight: msg.status === 'unread' ? '600' : 'normal' }}>
                          Subject: {msg.subject}
                        </p>
                        <p className="section-desc truncate-text" style={{ margin: '0' }}>
                          "{msg.content}"
                        </p>
                      </div>
                    ))}
                    {inboxMessages.length === 0 && (
                      <div className="empty-state">
                        <p>No replies in your inbox yet.</p>
                        <small>Launch a campaign and send pitches to get customer responses!</small>
                      </div>
                    )}
                  </div>
                </Hover3DCard>
              </div>
            </div>
          )}

          {/* PROFILE CONFIG TAB */}
          {activeTab === 'profile' && (
            <div className="tab-profile glass-panel fade-in">
              <h3>Agency Profile</h3>
              <p className="section-desc">Configure your agency details. These fields feed directly into all autopilot proposals and emails.</p>

              <form onSubmit={handleProfileSave} className="profile-form">
                <div className="form-group">
                  <label>Agency / Business Name</label>
                  <input 
                    type="text" 
                    value={profileForm.name} 
                    onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                    placeholder="e.g., PixelPrairie" 
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Primary Tech Stacks (comma separated)</label>
                  <input 
                    type="text" 
                    value={profileForm.techStack} 
                    onChange={e => setProfileForm({...profileForm, techStack: e.target.value})}
                    placeholder="e.g., Next.js 16, React, Tailwind CSS, ElevenLabs Voice AI" 
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Proposal Pricing / Pitch Formula</label>
                  <input 
                    type="text" 
                    value={profileForm.pricingFormula} 
                    onChange={e => setProfileForm({...profileForm, pricingFormula: e.target.value})}
                    placeholder="e.g., Custom pricing based on business goals" 
                    required
                  />
                  <small className="help-text">Your proposal outputs will quote this formulation instead of hardcoded numbers.</small>
                </div>

                <div className="form-group">
                   <label>Google PageSpeed API Key (Optional)</label>
                   <input 
                     type="password" 
                     value={profileForm.googleApiKey || ''} 
                     onChange={e => setProfileForm({...profileForm, googleApiKey: e.target.value})}
                     placeholder="Paste your Google API Key to avoid rate limits" 
                   />
                   <small className="help-text">Obtain a free API Key from Google's Developer Console to run unlimited PageSpeed audits.</small>
                 </div>

                 <div className="form-group" style={{ marginTop: '14px' }}>
                   <label>📍 Google Maps API Key (For Live Web Scraping)</label>
                   <input 
                     type="password" 
                     value={profileForm.googleMapsApiKey || ''} 
                     onChange={e => setProfileForm({...profileForm, googleMapsApiKey: e.target.value})}
                     placeholder="Paste your Google Maps API Key to scrape real local businesses" 
                   />
                   <small className="help-text">Required to scrape real local businesses instead of using demo fallback data. Enable the "Places API (New)" or "Places API" in Google Cloud.</small>
                 </div>

                 {/* ─── AI Brain API Keys ─── */}
                 <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-glass)', paddingTop: '24px' }}>
                   <h4 style={{ color: 'var(--accent-cyan)', marginBottom: '6px' }}>🧠 AI Brain — LLM Engine Keys</h4>
                   <p className="section-desc" style={{ marginBottom: '16px' }}>Connect a real AI brain to generate hyper-personalized pitch emails and objection replies. If both are empty, the agent runs in simulation mode using built-in templates.</p>

                   <div className="form-group">
                     <label>Gemini API Key (Recommended — Fast &amp; Free Tier Available)</label>
                     <input 
                       type="password" 
                       id="gemini-api-key-input"
                       value={profileForm.geminiApiKey || ''} 
                       onChange={e => setProfileForm({...profileForm, geminiApiKey: e.target.value})}
                       placeholder="Paste your Google Gemini API Key here" 
                     />
                     <small className="help-text">Get a free key at <strong>aistudio.google.com</strong>. Uses Gemini 2.5 Flash — ultra-fast and cost-effective.</small>
                   </div>

                   <div className="form-group" style={{ marginTop: '14px' }}>
                     <label>OpenAI API Key (Fallback — GPT-4o-mini)</label>
                     <input 
                       type="password" 
                       id="openai-api-key-input"
                       value={profileForm.openaiApiKey || ''} 
                       onChange={e => setProfileForm({...profileForm, openaiApiKey: e.target.value})}
                       placeholder="Paste your OpenAI API Key here (sk-...)" 
                     />
                     <small className="help-text">Used as fallback if Gemini key is empty. Get your key at <strong>platform.openai.com</strong>.</small>
                   </div>

                   <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(0,255,200,0.07)', border: '1px solid rgba(0,255,200,0.2)', borderRadius: '8px' }}>
                     <small style={{ color: 'var(--accent-cyan)' }}>⚡ <strong>Priority Order:</strong> If Gemini key is set → uses Gemini 2.5 Flash. If only OpenAI key is set → uses GPT-4o-mini. If neither → runs in simulation mode.</small>
                   </div>
                 </div>

                <div className="smtp-section" style={{ marginTop: '24px', borderTop: '1px solid var(--border-glass)', paddingTop: '24px' }}>
                  <h4>Outreach SMTP Mailer Setup (Optional)</h4>
                  <p className="section-desc">Connect your custom SMTP mailer to send real email pitches and objection replies directly from your address. If empty, the agent will run in simulation mode.</p>
                  
                  <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                    <div className="form-group">
                      <label>SMTP Host</label>
                      <input 
                        type="text" 
                        value={profileForm.smtpHost || ''} 
                        onChange={e => setProfileForm({...profileForm, smtpHost: e.target.value})}
                        placeholder="e.g., smtp.gmail.com" 
                      />
                    </div>
                    <div className="form-group">
                      <label>SMTP Port</label>
                      <input 
                        type="text" 
                        value={profileForm.smtpPort || ''} 
                        onChange={e => setProfileForm({...profileForm, smtpPort: e.target.value})}
                        placeholder="e.g., 587 or 465" 
                      />
                    </div>
                  </div>

                  <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                    <div className="form-group">
                      <label>SMTP Username / Email</label>
                      <input 
                        type="text" 
                        value={profileForm.smtpUser || ''} 
                        onChange={e => setProfileForm({...profileForm, smtpUser: e.target.value})}
                        placeholder="e.g., your-email@gmail.com" 
                      />
                    </div>
                    <div className="form-group">
                      <label>SMTP Password (or App Password)</label>
                      <input 
                        type="password" 
                        value={profileForm.smtpPass || ''} 
                        onChange={e => setProfileForm({...profileForm, smtpPass: e.target.value})}
                        placeholder="••••••••••••••••" 
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '16px', marginBottom: '20px' }}>
                    <label>SMTP Sender Display Header</label>
                    <input 
                      type="text" 
                      value={profileForm.smtpSender || ''} 
                      onChange={e => setProfileForm({...profileForm, smtpSender: e.target.value})}
                      placeholder="e.g., PixelPrairie &lt;your-email@gmail.com&gt;" 
                    />
                  </div>

                  <div style={{ marginTop: '16px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      onClick={handleTestSmtpConnection}
                      disabled={isTestingSmtp || !profileForm.smtpHost || !profileForm.smtpUser || !profileForm.smtpPass}
                    >
                      {isTestingSmtp ? 'Testing...' : 'Test SMTP Connection'}
                    </button>
                    {testSmtpStatus === 'success' && <span className="status-success" style={{ color: '#10b981' }}>✓ Connection successful! Test email sent.</span>}
                    {testSmtpStatus === 'error' && <span className="status-error" style={{ color: '#ef4444' }}>✗ Connection failed: {testSmtpError}</span>}
                  </div>
                </div>

                <div className="voice-setup-section" style={{ marginTop: '24px', borderTop: '1px solid var(--border-glass)', paddingTop: '24px' }}>
                  <h4>Voice Agent API Setup (Optional)</h4>
                  <p className="section-desc">Connect ElevenLabs and Twilio APIs to run real voice conversations in the browser sandbox or trigger real telephone calls to your phone.</p>
                  
                  <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                    <div className="form-group">
                      <label>ElevenLabs API Key</label>
                      <input 
                        type="password" 
                        value={profileForm.elevenlabsApiKey || ''} 
                        onChange={e => setProfileForm({...profileForm, elevenlabsApiKey: e.target.value})}
                        placeholder="Paste your ElevenLabs API Key" 
                      />
                    </div>
                    <div className="form-group">
                      <label>ElevenLabs Agent ID</label>
                      <input 
                        type="text" 
                        value={profileForm.elevenlabsAgentId || ''} 
                        onChange={e => setProfileForm({...profileForm, elevenlabsAgentId: e.target.value})}
                        placeholder="e.g., a8f9c1b3..." 
                      />
                    </div>
                  </div>

                  <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '16px', marginBottom: '20px' }}>
                    <div className="form-group">
                      <label>Twilio Account SID</label>
                      <input 
                        type="text" 
                        value={profileForm.twilioSid || ''} 
                        onChange={e => setProfileForm({...profileForm, twilioSid: e.target.value})}
                        placeholder="AC..." 
                      />
                    </div>
                    <div className="form-group">
                      <label>Twilio Auth Token</label>
                      <input 
                        type="password" 
                        value={profileForm.twilioAuthToken || ''} 
                        onChange={e => setProfileForm({...profileForm, twilioAuthToken: e.target.value})}
                        placeholder="Twilio Auth Token" 
                      />
                    </div>
                    <div className="form-group">
                      <label>Twilio Phone (or Phone ID)</label>
                      <input 
                        type="text" 
                        value={profileForm.twilioNumber || ''} 
                        onChange={e => setProfileForm({...profileForm, twilioNumber: e.target.value})}
                        placeholder="e.g., +17015550192 or pn_..." 
                      />
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={saveStatus === 'saving'}>
                    {saveStatus === 'saving' ? 'Saving...' : 'Save Configuration'}
                  </button>
                  {saveStatus === 'success' && <span className="status-success">✓ Profile updated successfully</span>}
                  {saveStatus === 'error' && <span className="status-error">✗ Failed to update profile</span>}
                </div>
              </form>
            </div>
          )}

          {/* AGENTS TAB (PLAYGROUND) */}
          {activeTab === 'agents' && !selectedAgent && (
            <div className="agents-grid fade-in">
              {agentsList.map(agent => (
                <div 
                  key={agent.id} 
                  className="agent-card glass-panel"
                  onClick={() => { setSelectedAgent(agent); setAgentInput(''); setAgentLogs([]); setAgentResult(''); }}
                >
                  <div className="agent-icon-box">{agent.icon}</div>
                  <h3>{agent.name}</h3>
                  <p>{agent.description}</p>
                  <button className="btn-launch">Open Sandbox Center &rarr;</button>
                </div>
              ))}
            </div>
          )}

          {/* SINGLE AGENT CONTROL ROOM (PLAYGROUND) */}
          {activeTab === 'agents' && selectedAgent && (
            <div className="agent-room fade-in">
              <div className="room-header">
                <button className="btn-back" onClick={() => { setSelectedAgent(null); if (logTimerRef.current) clearTimeout(logTimerRef.current); }}>
                  &larr; Back to Sandbox Center
                </button>
              </div>

              <div className="room-layout">
                <div className="room-controls glass-panel">
                  <h3>Agent Settings</h3>
                  <p className="room-desc">{selectedAgent.description}</p>

                  <div className="form-group" style={{ marginTop: '20px' }}>
                    <label>{selectedAgent.inputLabel}</label>
                    <textarea 
                      rows="3"
                      value={agentInput}
                      onChange={e => setAgentInput(e.target.value)}
                      placeholder={selectedAgent.placeholder}
                      disabled={isRunning}
                    ></textarea>
                  </div>

                  <button 
                    onClick={handleRunAgent} 
                    className="btn-primary run-button pulse-glow"
                    disabled={isRunning || !agentInput.trim()}
                  >
                    {isRunning ? (
                      <span className="loader-container">
                        <span className="spinner"></span> Running Sandbox...
                      </span>
                    ) : 'Execute Agent Play'}
                  </button>
                </div>

                <div className="room-console glass-panel">
                  <div className="console-header">
                    <span className="console-dot-red"></span>
                    <span className="console-dot-yellow"></span>
                    <span className="console-dot-green"></span>
                    <span className="console-title">Agent Execution Stream</span>
                  </div>
                  <div className="console-body">
                    {agentLogs.length === 0 && !isRunning && (
                      <p className="console-placeholder">
                        <span className="prompt-char">&gt;</span> Run the agent sandbox to audit thinking traces...
                      </p>
                    )}

                    {agentLogs.map((log, index) => (
                      <div key={index} className={`console-line log-${log.type}`}>
                        <span className="console-time">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                        <span className="console-type">{log.type.toUpperCase()}:</span> {log.message}
                      </div>
                    ))}

                    {isRunning && (
                      <div className="console-line console-active">
                        <span className="console-time">[{new Date().toLocaleTimeString()}]</span>{' '}
                        <span className="console-type">THINKING:</span> Auditing local business factors...
                        <span className="cursor-blink">_</span>
                      </div>
                    )}
                    <div ref={consoleEndRef} />
                  </div>
                </div>
              </div>

              {agentResult && (
                <div className="agent-result glass-panel fade-in">
                  <div className="result-header">
                    <h3>📄 Final Generated Document</h3>
                    <button 
                      className="btn-secondary btn-sm"
                      onClick={() => {
                        navigator.clipboard.writeText(agentResult);
                        alert("Copied to clipboard!");
                      }}
                    >
                      Copy Markdown
                    </button>
                  </div>
                  <div 
                    className="result-body markdown-content"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(agentResult) }}
                  />
                </div>
              )}
            </div>
          )}

          {/* AUTOPILOT CAMPAIGNS TAB */}
          {activeTab === 'autopilot' && !selectedCampaign && (
            <div className="autopilot-tab fade-in">
              <div className="autopilot-layout">
                {/* Campaign Creator Panel */}
                <Hover3DCard className="campaign-creator">
                  <h3>New Autopilot Campaign</h3>
                  <p className="section-desc">Instruct the AI agent to search local businesses, inspect their web presence, and draft pitches automatically.</p>

                  <form onSubmit={handleLaunchCampaign} className="profile-form" style={{ marginTop: '16px' }}>
                    <div className="form-group">
                      <label>Target Business Niche</label>
                      <select 
                        value={newCampaign.niche} 
                        onChange={e => setNewCampaign({...newCampaign, niche: e.target.value})}
                      >
                        <option value="Hair Salon">Hair Salons / Barbers</option>
                        <option value="Childcare Provider">Childcare / Daycare Providers</option>
                        <option value="Landscaping & Snow">Landscaping / Garden Services</option>
                        <option value="Dentist Clinic">Dentists / Dental Clinics</option>
                        <option value="Chiropractor Clinic">Chiropractors / Physio Clinics</option>
                        <option value="Auto Repair Shop">Auto Repair & Mechanic Shops</option>
                        <option value="Plumber & HVAC Services">Plumbers & HVAC Engineers</option>
                        <option value="Gym & Fitness Center">Local Gyms & Fitness Centers</option>
                        <option value="Restaurant & Cafe">Restaurants / Cafes / Bakeries</option>
                        <option value="Veterinary Clinic">Veterinary Clinics / Pet Groomers</option>
                        <option value="CPA Accounting Firm">Local CPA & Accounting Firms</option>
                        <option value="Real Estate Brokerage">Real Estate Agencies</option>
                        <option value="Cleaning Services">Residential Cleaning Services</option>
                        <option value="Law Firm">Law Firms & Legal Offices</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Target Location</label>
                      <input 
                        type="text" 
                        value={newCampaign.location} 
                        onChange={e => setNewCampaign({...newCampaign, location: e.target.value})}
                        placeholder="e.g. Fargo, ND or Moorhead, MN" 
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Outreach Leads Size</label>
                      <select 
                        value={newCampaign.size} 
                        onChange={e => setNewCampaign({...newCampaign, size: e.target.value})}
                      >
                        <option value="3">3 leads (Fargo local audit pool)</option>
                        <option value="5">5 leads (Extended audit pool)</option>
                        <option value="10">10 leads (Full local directory filter)</option>
                      </select>
                    </div>

                    <button type="submit" className="btn-primary run-button pulse-glow" disabled={campaignCreating}>
                      {campaignCreating ? 'Starting Agent...' : 'Launch Autopilot Agent'}
                    </button>
                  </form>
                </Hover3DCard>

                {/* Campaigns Archive list */}
                <Hover3DCard className="campaigns-archive">
                  <h3>Campaign History</h3>
                  <p className="section-desc">Track active background processes and email outreach progress.</p>

                  <div className="campaigns-list" style={{ marginTop: '16px' }}>
                    {campaigns.map(c => (
                      <div 
                        key={c.id} 
                        className={`campaign-list-card ${c.status === 'running' ? 'active-run' : ''}`}
                        onClick={() => setSelectedCampaign(c)}
                      >
                        <div className="c-card-header">
                          <h4>{c.niche} ({c.location})</h4>
                          <span className={`c-status-badge status-${c.status}`}>{c.status.toUpperCase()}</span>
                        </div>
                        <p className="c-card-meta">Created: {new Date(c.timestamp).toLocaleDateString()}</p>
                        
                        <div className="c-progress-container">
                          <div className="c-progress-bar" style={{ width: `${c.progress}%` }}></div>
                        </div>
                        <div className="c-card-footer">
                          <span>Progress: {c.progress}%</span>
                          <span>Leads Found: {c.leads?.length || 0}</span>
                        </div>
                      </div>
                    ))}
                    {campaigns.length === 0 && (
                      <div className="empty-state" style={{ padding: '60px' }}>
                        <p>No campaigns have been run yet.</p>
                      </div>
                    )}
                  </div>
                </Hover3DCard>
              </div>
            </div>
          )}

          {/* ACTIVE CAMPAIGN DASHBOARD VIEW */}
          {activeTab === 'autopilot' && selectedCampaign && (
            <div className="campaign-dashboard fade-in">
              <div className="room-header">
                <button className="btn-back" onClick={() => { setSelectedCampaign(null); setExpandedLeadId(null); }}>
                  &larr; Back to Campaigns List
                </button>
              </div>

              <div className="campaign-info glass-panel">
                <div className="campaign-info-header">
                  <div>
                    <h3>Autopilot Target: {selectedCampaign.niche} in {selectedCampaign.location}</h3>
                    <p className="c-card-meta">Launched: {new Date(selectedCampaign.timestamp).toLocaleString()}</p>
                  </div>
                  <span className={`c-status-badge status-${selectedCampaign.status}`}>{selectedCampaign.status.toUpperCase()}</span>
                </div>

                <div className="c-progress-container" style={{ margin: '16px 0', height: '8px' }}>
                  <div className="c-progress-bar" style={{ width: `${selectedCampaign.progress}%` }}></div>
                </div>
                <div className="campaign-stats-bar">
                  <span><strong>Audit Progress:</strong> {selectedCampaign.progress}%</span>
                  <span><strong>Leads Scanned:</strong> {selectedCampaign.leads?.length || 0}</span>
                  <span><strong>Emails Sent:</strong> {selectedCampaign.leads?.filter(l => l.status === 'sent').length || 0}</span>
                </div>
              </div>

              <h3 style={{ margin: '24px 0 12px 0' }}>Discovered Leads & Email Drafts</h3>
              <div className="leads-list">
                {selectedCampaign.leads?.map(lead => {
                  const speedData = extractScoreAndLoadTime(lead.issue);
                  return (
                    <Hover3DCard 
                      key={lead.id} 
                      className={`lead-card ${expandedLeadId === lead.id ? 'expanded' : ''}`}
                      onClick={() => setExpandedLeadId(expandedLeadId === lead.id ? null : lead.id)}
                    >
                      <div className="lead-card-header">
                        <div>
                          <h4>{lead.name} {lead.meetingBooked && <span style={{ color: 'var(--accent-green)' }}>📅 (iPhone Call Synced)</span>}</h4>
                          <a href={`https://${lead.url}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="lead-url">
                            {lead.url} ↗
                          </a>
                        </div>
                        <span className={`lead-status-badge badge-${lead.status}`}>
                          {lead.status === 'discovered' && 'DISCOVERED'}
                          {lead.status === 'auditing' && 'AUDITING WEBSITE...'}
                          {lead.status === 'drafted' && 'PITCH DRAFTED'}
                          {lead.status === 'sent' && '✓ EMAIL SENT'}
                        </span>
                      </div>

                      {speedData.score !== null && (
                        <div onClick={e => e.stopPropagation()}>
                          <PageSpeedGauge score={speedData.score} time={speedData.time} />
                        </div>
                      )}

                      <p className="lead-issue"><strong>Scanned Flaw:</strong> {lead.issue}</p>
                      <p className="lead-contact"><strong>Contact:</strong> {lead.email} | {lead.phone}</p>

                      {lead.pitch && (
                        <div className="lead-pitch-review" onClick={e => e.stopPropagation()}>
                          <div className="pitch-actions">
                            <button 
                              className="btn-primary btn-sm"
                              disabled={lead.status === 'sent'}
                              onClick={() => handleSendPitch(selectedCampaign.id, lead.id)}
                            >
                              {lead.status === 'sent' ? '✓ Sent Pitch Email' : 'Send Pitch Email Now'}
                            </button>
                            <button 
                              className="btn-secondary btn-sm"
                              onClick={() => {
                                navigator.clipboard.writeText(lead.pitch);
                                alert("Pitch copied!");
                              }}
                            >
                              Copy Pitch Text
                            </button>
                          </div>
                          <div className="markdown-content lead-pitch-body">
                            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(lead.pitch) }} />
                          </div>
                        </div>
                      )}
                    </Hover3DCard>
                  );
                })}
                {(!selectedCampaign.leads || selectedCampaign.leads.length === 0) && (
                  <div className="glass-panel text-center" style={{ padding: '40px', color: 'var(--text-muted)' }}>
                    Searching local directories... Scanning websites...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* INBOX REPLIES TAB */}
          {activeTab === 'inbox' && !selectedMessage && (
            <div className="tab-history glass-panel fade-in">
              <h3>Customer Response Inbox</h3>
              <p className="section-desc">Review replies from campaign targets. The agent will analyze their objections and draft responses.</p>

              <div className="history-table-wrapper" style={{ marginTop: '20px' }}>
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Lead Name</th>
                      <th>Objection Subject</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inboxMessages.map(msg => (
                      <tr key={msg.id}>
                        <td>{new Date(msg.timestamp).toLocaleDateString()}</td>
                        <td style={{ fontWeight: msg.status === 'unread' ? 'bold' : 'normal', color: 'white' }}>{msg.leadName}</td>
                        <td className="truncate-text" style={{ fontStyle: msg.status === 'unread' ? 'italic' : 'normal' }}>
                          {msg.subject}
                        </td>
                        <td>
                          <span className={`c-status-badge status-${msg.status === 'meeting_booked' ? 'completed' : msg.status === 'replied' ? 'running' : 'searching'}`}>
                            {msg.status === 'unread' ? 'Objection Unread' : msg.status === 'replied' ? 'Objection Replied' : 'Follow-up Sent'}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="btn-secondary btn-sm"
                            onClick={() => {
                              setSelectedMessage(msg);
                              setInboxResult(msg.reply || '');
                              setObjectionCategory(msg.objectionCategory || '');
                              setTacticsUsed(msg.tacticsUsed || []);
                            }}
                          >
                            Solve Objection
                          </button>
                        </td>
                      </tr>
                    ))}
                    {inboxMessages.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                          Your inbox is empty. Mark a lead's email pitch as "Sent" in Autopilot Campaigns, and check back here!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SINGLE EMAIL OBJECTION SOLVER VIEW */}
          {activeTab === 'inbox' && selectedMessage && (
            <div className="agent-room fade-in">
              <div className="room-header">
                <button className="btn-back" onClick={() => { setSelectedMessage(null); if (inboxTimerRef.current) clearTimeout(inboxTimerRef.current); }}>
                  &larr; Back to Inbound Inbox
                </button>
              </div>

              <div className="room-layout">
                {/* Email Thread UI */}
                <div className="room-controls glass-panel" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', color: 'white' }}>
                      {selectedMessage.leadName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{selectedMessage.leadName}</h3>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>&lt;{selectedMessage.leadEmail}&gt;</p>
                    </div>
                  </div>
                  
                  <div className="history-list-item" style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.85rem' }}>
                      <strong style={{ color: 'white' }}>Subject: {selectedMessage.subject}</strong>
                      <span style={{ color: 'var(--text-muted)' }}>{new Date(selectedMessage.timestamp).toLocaleString()}</span>
                    </div>
                    <hr style={{ margin: '12px 0', borderColor: 'rgba(255,255,255,0.05)' }} />
                    <p style={{ color: 'white', whiteSpace: 'pre-line', lineHeight: '1.6', fontSize: '0.95rem' }}>
                      {selectedMessage.content}
                    </p>
                  </div>

                  <button 
                    onClick={handleGenerateSmartReply}
                    className="btn-primary run-button pulse-glow"
                    disabled={isAnalyzingReply || selectedMessage.status === 'meeting_booked'}
                  >
                    {isAnalyzingReply ? (
                      <span className="loader-container">
                        <span className="spinner"></span> Resolving Objections...
                      </span>
                    ) : 'Generate Smart Objection Reply'}
                  </button>

                  {/* Tactics Sidebar */}
                  {tacticsUsed.length > 0 && (
                    <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-glass)', paddingTop: '20px' }}>
                      <span className="badge" style={{ marginBottom: '8px', display: 'inline-block' }}>Objection Playbook Used</span>
                      <h4 style={{ color: 'white', marginBottom: '8px' }}>Category: {objectionCategory.toUpperCase()}</h4>
                      <ul style={{ paddingLeft: '16px' }}>
                        {tacticsUsed.map((t, i) => (
                          <li key={i} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Reply Stream Logs Console */}
                <div className="room-console glass-panel">
                  <div className="console-header">
                    <span className="console-dot-red"></span>
                    <span className="console-dot-yellow"></span>
                    <span className="console-dot-green"></span>
                    <span className="console-title">Objection Solver Stream</span>
                  </div>
                  <div className="console-body">
                    {inboxLogs.length === 0 && !isAnalyzingReply && !inboxResult && (
                      <p className="console-placeholder">
                        <span className="prompt-char">&gt;</span> Click resolve to stream the AI agent's playbook logic...
                      </p>
                    )}

                    {inboxLogs.map((log, index) => (
                      <div key={index} className={`console-line log-${log.type}`}>
                        <span className="console-time">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                        <span className="console-type">{log.type.toUpperCase()}:</span> {log.message}
                      </div>
                    ))}

                    {isAnalyzingReply && (
                      <div className="console-line console-active">
                        <span className="console-time">[{new Date().toLocaleTimeString()}]</span>{' '}
                        <span className="console-type">THINKING:</span> Searching PixelPrairie objections guide...
                        <span className="cursor-blink">_</span>
                      </div>
                    )}
                    
                    {/* Render static logs if already replied */}
                    {inboxLogs.length === 0 && inboxResult && (
                      <div className="console-line log-observation">
                        <span className="console-time">[{new Date(selectedMessage.timestamp).toLocaleTimeString()}]</span>{' '}
                        <span className="console-type">OBSERVATION:</span> Smart response generated using the {objectionCategory.toUpperCase()} sales playbook.
                      </div>
                    )}
                    <div ref={inboxConsoleEndRef} />
                  </div>
                </div>
              </div>

              {/* Final Negotiated Email Reply */}
              {inboxResult && (
                <div className="agent-result glass-panel fade-in">
                  <div className="result-header">
                    <h3>✉️ Drafted Email Response</h3>
                    <div className="pitch-actions">
                      <button 
                        className="btn-primary" 
                        disabled={selectedMessage.status === 'meeting_booked'}
                        onClick={handleBookMeeting}
                      >
                        {selectedMessage.status === 'meeting_booked' ? '✓ Email Sent' : 'Send Reply & Ask to Call'}
                      </button>
                      <button 
                        className="btn-secondary"
                        onClick={() => {
                          navigator.clipboard.writeText(inboxResult);
                          alert("Response copied!");
                        }}
                      >
                        Copy Response Text
                      </button>
                    </div>
                  </div>
                  <div className="lead-pitch-body" style={{ background: 'rgba(15,23,42,0.4)', color: 'white', whiteSpace: 'pre-line', padding: '24px', fontSize: '0.95rem' }}>
                    {inboxResult}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* HISTORY ARCHIVE TAB */}
          {activeTab === 'history' && (
            <div className="tab-history glass-panel fade-in">
              <h3>Manual Scans Archive</h3>
              <p className="section-desc">Search and review documents created manually inside the playground.</p>

              <div className="history-table-wrapper" style={{ marginTop: '20px' }}>
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Agent Type</th>
                      <th>Input Parameter</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(item => {
                      const agentDetail = agentsList.find(a => a.id === item.agentId);
                      return (
                        <tr key={item.id}>
                          <td>{new Date(item.timestamp).toLocaleString()}</td>
                          <td>
                            <span className={`badge-agent badge-${item.agentId}`}>
                              {agentDetail?.name || item.agentId}
                            </span>
                          </td>
                          <td className="truncate-text">{item.input}</td>
                          <td>
                            <button 
                              className="btn-secondary btn-sm"
                              onClick={() => setSelectedHistoryItem(item)}
                            >
                              Open Document
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {history.length === 0 && (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>
                          No history found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VOICE CALL SANDBOX TAB */}
          {activeTab === 'voice-sandbox' && (
            <div className="tab-voice-sandbox fade-in">
              <div className="sandbox-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
                
                {/* Left Column: Simulator Console */}
                <Hover3DCard className="sandbox-card" style={{ position: 'relative', minHeight: '520px', padding: '24px' }}>
                  <h3>Interactive Web Voice Simulator</h3>
                  <p className="section-desc">Test the voice receptionist in your browser instantly. Grant microphone permission and speak naturally to the AI receptionist.</p>

                  {/* ElevenLabs HD Voice Toggle */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    marginTop: '16px',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    width: '100%',
                    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05)',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'white' }}>ElevenLabs HD Voice</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {profile.elevenlabsApiKey ? "Using Rachel's natural neural voice model" : "Configure API Key in Agency Profile to enable"}
                      </span>
                    </div>
                    <label style={{
                      position: 'relative',
                      display: 'inline-block',
                      width: '46px',
                      height: '24px',
                      cursor: 'pointer'
                    }}>
                      <input 
                        type="checkbox" 
                        checked={useElevenLabsTts}
                        onChange={e => {
                          if (e.target.checked && !profile.elevenlabsApiKey) {
                            alert("Please configure your ElevenLabs API Key in the Agency Profile first.");
                            return;
                          }
                          setUseElevenLabsTts(e.target.checked);
                        }}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: useElevenLabsTts ? '#10b981' : '#374151',
                        transition: '0.3s',
                        borderRadius: '24px',
                        boxShadow: useElevenLabsTts ? '0 0 8px rgba(16, 185, 129, 0.5)' : 'none'
                      }}>
                        <span style={{
                          position: 'absolute',
                          content: '""',
                          height: '18px',
                          width: '18px',
                          left: useElevenLabsTts ? '24px' : '4px',
                          bottom: '3px',
                          backgroundColor: 'white',
                          transition: '0.3s',
                          borderRadius: '50%',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                      </span>
                    </label>
                  </div>

                  <div className="simulator-body" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                    
                    {simStatus !== 'idle' ? (
                      <div className={`sim-calling-screen ${isSilenceAlertActive ? 'silence-warning' : ''}`} style={{ textAlign: 'center', width: '100%' }}>
                        {/* 3D Hologram Voice Orb */}
                        <div className={`holo-visualizer-orb ${simSpeaker === 'agent' ? 'speaking' : ''}`}>
                          <div className="holo-ring-outer"></div>
                          <div className="holo-ring-middle"></div>
                          <div className="holo-ring-inner">
                            <div className="holo-pulse-wave"></div>
                          </div>
                          <div className="holo-core-sphere"></div>
                        </div>

                        <h4 style={{ color: 'white', marginTop: '16px', fontSize: '1.2rem', marginBottom: '4px' }}>PixelPrairie AI Assistant</h4>
                        <p style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px', marginBottom: '20px' }}>
                          {simStatus === 'calling' && 'Calling...'}
                          {simStatus === 'ringing' && 'Ringing...'}
                          {simStatus === 'connected' && 'Call Connected'}
                        </p>

                        {/* Audio Wave Visualizer */}
                        {simStatus === 'connected' && (
                          <div className={`wave-container ${simSpeaker !== '' ? 'animating' : ''}`}>
                            <span className="wave-bar"></span>
                            <span className="wave-bar"></span>
                            <span className="wave-bar"></span>
                            <span className="wave-bar"></span>
                            <span className="wave-bar"></span>
                          </div>
                        )}

                        {/* Transcript log inside active call */}
                        <div className="sim-live-transcript" style={{ maxHeight: '180px', overflowY: 'auto', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', padding: '16px', textAlign: 'left', marginBottom: '24px', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {simTranscript.map((log, idx) => (
                            <div key={idx} className={`transcript-line ${log.sender}`} style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                              <strong style={{ color: log.sender === 'user' ? '#60a5fa' : log.sender === 'agent' ? 'var(--accent-green)' : '#94a3b8' }}>
                                {log.sender === 'user' ? 'You: ' : log.sender === 'agent' ? 'AI Assistant: ' : 'System: '}
                              </strong>
                              <span style={{ color: log.sender === 'system' ? '#94a3b8' : 'white', fontStyle: log.sender === 'system' ? 'italic' : 'normal' }}>{log.text}</span>
                            </div>
                          ))}
                        </div>

                        <button onClick={hangUpSimCall} className="btn-hangup">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '18px', height: '18px' }}>
                            <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.18.282-.108.43a13.69 13.69 0 006.012 6.012c.148.072.329.027.43-.108l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
                          </svg>
                          Disconnect
                        </button>
                      </div>
                    ) : (
                      <div className="sim-idle-screen" style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <div className="dialer-logo" style={{ fontSize: '3.5rem', marginBottom: '16px' }}>📞</div>
                        <p style={{ color: 'var(--text-secondary)', maxWidth: '320px', margin: '0 auto 24px auto', fontSize: '0.9rem', lineHeight: '1.5' }}>
                          Simulate a phone call locally inside your browser using PixelPrairie's preloaded sales playbook guidelines.
                        </p>
                        <button onClick={startSimCall} className="btn-primary pulse-glow" style={{ padding: '12px 32px', borderRadius: '30px', fontSize: '0.95rem' }}>
                          Start Browser Voice Demo
                        </button>
                      </div>
                    )}
                  </div>
                </Hover3DCard>

                {/* Right Column: Real call & dialer options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Real Web Call Panel */}
                  <Hover3DCard className="sandbox-card" style={{ padding: '24px' }}>
                    <h3>Real Web Call (ElevenLabs SDK)</h3>
                    <p className="section-desc">Connect directly to your active ElevenLabs agent voice via browser WebRTC connection.</p>
                    
                    <div style={{ marginTop: '20px' }}>
                      {webCallStatus === 'connected' ? (
                        <div style={{ textAlign: 'center' }}>
                          <span className="status-success" style={{ display: 'block', marginBottom: '16px', color: '#10b981', fontWeight: 'bold' }}>✓ Session Active</span>
                          <button onClick={endRealWebCall} className="btn-hangup">
                            Disconnect Call
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={startRealWebCall} 
                          className="btn-primary" 
                          disabled={webCallStatus === 'connecting'}
                          style={{ width: '100%', padding: '12px' }}
                        >
                          {webCallStatus === 'connecting' ? 'Connecting WebRTC...' : 'Start Web Agent Call'}
                        </button>
                      )}
                    </div>
                  </Hover3DCard>

                  {/* Real Phone Call Dialer */}
                  <Hover3DCard className="sandbox-card" style={{ padding: '24px' }}>
                    <h3>Real Phone Call Sandbox</h3>
                    <p className="section-desc">Make a real telephone call to your iPhone to test natural latency, sound quality, and conversation flow.</p>
                    
                    <div className="profile-form" style={{ marginTop: '20px' }}>
                      <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label>Your Phone Number (Destination)</label>
                        <input 
                          type="text" 
                          value={dialPhone} 
                          onChange={e => setDialPhone(e.target.value)} 
                          placeholder="e.g., +17014046442"
                          style={{ width: '100%', marginTop: '6px' }}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label>Outbound Dialing Strategy</label>
                        <select 
                          value={dialMethod} 
                          onChange={e => setDialMethod(e.target.value)}
                          style={{ width: '100%', marginTop: '6px' }}
                        >
                          <option value="elevenlabs">ElevenLabs Telephony API (Direct)</option>
                          <option value="twilio">Twilio Custom Webhook API (Server Relay)</option>
                        </select>
                      </div>

                      {dialMethod === 'twilio' && (
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                          <label>Public Webhook Base URL</label>
                          <input 
                            type="text" 
                            value={publicServerUrl} 
                            onChange={e => setPublicServerUrl(e.target.value)} 
                            placeholder="e.g., https://your-ngrok-subdomain.ngrok-free.app"
                            style={{ width: '100%', marginTop: '6px' }}
                          />
                          <small className="help-text" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                            Your local server must be exposed via ngrok or tunnel for Twilio to request TwiML.
                          </small>
                        </div>
                      )}

                      <button 
                        onClick={handlePhoneDial} 
                        className="btn-primary" 
                        disabled={dialStatus === 'calling' || !dialPhone}
                        style={{ width: '100%', marginTop: '12px', padding: '12px' }}
                      >
                        {dialStatus === 'calling' ? 'Calling...' : 'Call My Phone Now'}
                      </button>

                      {dialStatus === 'success' && (
                        <span className="status-success" style={{ display: 'block', marginTop: '12px', color: '#10b981', textAlign: 'center', fontSize: '0.9rem' }}>
                          ✓ Call placed successfully! Check your phone.
                        </span>
                      )}
                      {dialStatus === 'error' && (
                        <span className="status-error" style={{ display: 'block', marginTop: '12px', color: '#ef4444', textAlign: 'center', fontSize: '0.9rem' }}>
                          ✗ Call failed: {dialError}
                        </span>
                      )}
                    </div>
                  </Hover3DCard>

                  {/* Settings quick links */}
                  <Hover3DCard className="sandbox-card" style={{ padding: '16px' }}>
                    <h4 style={{ color: 'white', fontSize: '0.9rem' }}>Quick Note on Credentials</h4>
                    <p className="section-desc" style={{ fontSize: '0.8rem', margin: '6px 0 0 0', lineHeight: '1.4' }}>
                      To configure Twilio credentials or your ElevenLabs API Key / Agent ID, navigate to the <span style={{ color: '#60a5fa', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setActiveTab('profile')}>Agency Profile</span> tab.
                    </p>
                  </Hover3DCard>
                </div>

              </div>
            </div>
          )}
        </section>
      </main>

      {/* History Details Modal */}
      {selectedHistoryItem && (
        <div className="modal-backdrop" onClick={() => setSelectedHistoryItem(null)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {agentsList.find(a => a.id === selectedHistoryItem.agentId)?.name || selectedHistoryItem.agentId} Document
              </h3>
              <button className="btn-close" onClick={() => setSelectedHistoryItem(null)}>&times;</button>
            </div>
            <div className="modal-meta">
              <span><strong>Query:</strong> {selectedHistoryItem.input}</span>
              <span><strong>Run On:</strong> {new Date(selectedHistoryItem.timestamp).toLocaleString()}</span>
            </div>
            <div className="modal-body markdown-content">
              <div dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedHistoryItem.result) }} />
            </div>
            <div className="modal-footer">
              <button 
                className="btn-primary" 
                onClick={() => {
                  navigator.clipboard.writeText(selectedHistoryItem.result);
                  alert("Copied to clipboard!");
                }}
              >
                Copy Markdown
              </button>
              <button className="btn-secondary" onClick={() => setSelectedHistoryItem(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
