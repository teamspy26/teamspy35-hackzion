'use client'
import { useState } from 'react'
import {
  AlertTriangle, Bell, CheckCircle, Clock, Mail, Send,
  Shield, Truck, Users, Wifi, Zap,
} from 'lucide-react'

type RecipientGroup = 'operators' | 'drivers' | 'all' | 'custom'
type AlertType      = 'info' | 'warning' | 'emergency' | 'route' | 'weather'

interface SentLog {
  id: string
  timestamp: string
  subject: string
  alertType: AlertType
  recipientGroup: RecipientGroup
  customEmail?: string
  sent: number
  status: 'success' | 'partial' | 'failed'
}

const RECIPIENT_OPTIONS: { value: RecipientGroup; label: string; desc: string; icon: React.ReactNode; count: number }[] = [
  { value: 'all',       label: 'All Team',  desc: 'Operators + Drivers', icon: <Users size={14} />,    count: 5 },
  { value: 'operators', label: 'Operators', desc: '2 hub operators',      icon: <Shield size={14} />,   count: 2 },
  { value: 'drivers',   label: 'Drivers',   desc: '3 active drivers',     icon: <Truck size={14} />,    count: 3 },
  { value: 'custom',    label: 'Custom',    desc: 'Enter email manually',  icon: <Mail size={14} />,     count: 0 },
]

const ALERT_TYPES: { value: AlertType; label: string; color: string; bg: string; border: string; icon: string }[] = [
  { value: 'info',      label: 'Info',          color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-300',   icon: 'ℹ️' },
  { value: 'warning',   label: 'Warning',       color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-300',  icon: '⚠️' },
  { value: 'emergency', label: 'Emergency',     color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-300',    icon: '🚨' },
  { value: 'route',     label: 'Route Update',  color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-300', icon: '🗺️' },
  { value: 'weather',   label: 'Weather Alert', color: 'text-cyan-700',   bg: 'bg-cyan-50',   border: 'border-cyan-300',   icon: '🌧️' },
]

const QUICK_TEMPLATES: { label: string; type: AlertType; subject: string; message: string }[] = [
  {
    label: 'High Traffic',
    type: 'warning',
    subject: 'High Traffic Alert on NH-44',
    message: 'Heavy congestion detected on NH-44 between Bangalore and Chennai. ETA has increased by 30 minutes. Please update customers and consider alternate routes via NH-48.',
  },
  {
    label: 'Route Change',
    type: 'route',
    subject: 'Mandatory Route Change – Effective Immediately',
    message: 'Due to an accident on the primary route, all deliveries must switch to the alternate highway. Update your navigation and inform dispatch immediately.',
  },
  {
    label: 'Flood Warning',
    type: 'emergency',
    subject: '🚨 Flood Warning – Avoid Low-Lying Routes',
    message: 'Severe flooding reported in Andhra Pradesh corridor. All drivers must avoid NH-16 and NH-65 until further notice. Park vehicles at designated safe zones and await clearance.',
  },
  {
    label: 'Break Reminder',
    type: 'info',
    subject: 'Mandatory Break Reminder for All Drivers',
    message: 'As per safety protocols, all drivers on routes exceeding 4 hours must take a 15-minute break at the next designated rest stop. Report your status after the break.',
  },
  {
    label: 'Weather Storm',
    type: 'weather',
    subject: 'Storm Warning – Reduce Speed & Caution',
    message: 'IMD has issued a storm warning for Mumbai–Pune corridor. Reduce speed to below 40 km/h, turn on hazard lights, and halt if visibility drops. Safety is the top priority.',
  },
]

export default function AlertCenter() {
  const [recipientGroup, setRecipientGroup] = useState<RecipientGroup>('all')
  const [customEmail,    setCustomEmail]    = useState('')
  const [alertType,      setAlertType]      = useState<AlertType>('info')
  const [subject,        setSubject]        = useState('')
  const [message,        setMessage]        = useState('')
  const [sending,        setSending]        = useState(false)
  const [sentLog,        setSentLog]        = useState<SentLog[]>([])
  const [lastResult,     setLastResult]     = useState<{ ok: boolean; msg: string } | null>(null)

  const selectedType = ALERT_TYPES.find(t => t.value === alertType)!
  const selectedGroup = RECIPIENT_OPTIONS.find(r => r.value === recipientGroup)!

  function applyTemplate(tpl: typeof QUICK_TEMPLATES[0]) {
    setAlertType(tpl.type)
    setSubject(tpl.subject)
    setMessage(tpl.message)
    setLastResult(null)
  }

  async function handleSend() {
    if (!subject.trim() || !message.trim()) {
      setLastResult({ ok: false, msg: 'Please fill in Subject and Message.' })
      return
    }
    if (recipientGroup === 'custom' && !customEmail.trim()) {
      setLastResult({ ok: false, msg: 'Please enter a custom email address.' })
      return
    }

    setSending(true)
    setLastResult(null)
    try {
      const res = await fetch('/api/send-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientGroup,
          customEmail: customEmail.trim() || undefined,
          alertType,
          subject: subject.trim(),
          message: message.trim(),
          senderName: 'Fleet Manager',
        }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        const log: SentLog = {
          id:             `log-${Date.now()}`,
          timestamp:      new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          subject:        subject.trim(),
          alertType,
          recipientGroup,
          customEmail:    recipientGroup === 'custom' ? customEmail : undefined,
          sent:           data.sent,
          status:         data.failed > 0 ? 'partial' : 'success',
        }
        setSentLog(prev => [log, ...prev.slice(0, 9)])
        setLastResult({ ok: true, msg: `Alert sent to ${data.sent} recipient${data.sent !== 1 ? 's' : ''} successfully.` })
        setSubject('')
        setMessage('')
      } else {
        setLastResult({ ok: false, msg: data.error ?? 'Failed to send alert. Please try again.' })
      }
    } catch {
      setLastResult({ ok: false, msg: 'Network error. Check your connection and try again.' })
    }
    setSending(false)
  }

  return (
    <div className="space-y-5">

      {/* Quick Templates */}
      <div>
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Quick Templates</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_TEMPLATES.map(tpl => {
            const t = ALERT_TYPES.find(a => a.value === tpl.type)!
            return (
              <button
                key={tpl.label}
                onClick={() => applyTemplate(tpl)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all hover:shadow-sm ${t.bg} ${t.color} ${t.border}`}
              >
                {t.icon} {tpl.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">

        {/* Left — Compose */}
        <div className="col-span-7 space-y-4">

          {/* Recipients */}
          <div>
            <label className="text-xs font-semibold text-zinc-500 mb-2 block">Recipients</label>
            <div className="grid grid-cols-4 gap-2">
              {RECIPIENT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setRecipientGroup(opt.value)}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                    recipientGroup === opt.value
                      ? 'bg-[#111111] text-white border-[#111111]'
                      : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={recipientGroup === opt.value ? 'text-brand-yellow' : 'text-zinc-400'}>{opt.icon}</span>
                    <span className="text-xs font-bold">{opt.label}</span>
                  </div>
                  <span className={`text-[10px] ${recipientGroup === opt.value ? 'text-zinc-400' : 'text-zinc-400'}`}>{opt.desc}</span>
                </button>
              ))}
            </div>
            {recipientGroup === 'custom' && (
              <input
                type="email"
                value={customEmail}
                onChange={e => setCustomEmail(e.target.value)}
                placeholder="recipient@example.com"
                className="mt-2 w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#111111] focus:border-transparent"
              />
            )}
          </div>

          {/* Alert Type */}
          <div>
            <label className="text-xs font-semibold text-zinc-500 mb-2 block">Alert Type</label>
            <div className="flex flex-wrap gap-2">
              {ALERT_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setAlertType(t.value)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                    alertType === t.value
                      ? `${t.bg} ${t.color} ${t.border} shadow-sm`
                      : 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Urgent Route Change – NH-44 Closed"
              className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#111111] focus:border-transparent"
            />
          </div>

          {/* Message */}
          <div>
            <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">Message</label>
            <textarea
              rows={5}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Write your alert message here. Be clear and specific for drivers and operators to act on."
              className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#111111] focus:border-transparent resize-none"
            />
            <p className="text-[11px] text-zinc-400 mt-1">{message.length} characters</p>
          </div>

          {/* Send button + result */}
          <div className="space-y-2">
            <button
              onClick={handleSend}
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 bg-[#111111] text-white font-bold py-3 rounded-xl hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {sending ? (
                <>
                  <Wifi size={15} className="animate-pulse" />
                  Sending via Gmail SMTP…
                </>
              ) : (
                <>
                  <Send size={15} />
                  Send Alert Email
                </>
              )}
            </button>

            {lastResult && (
              <div className={`flex items-start gap-2 text-sm rounded-xl px-4 py-3 border ${
                lastResult.ok
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {lastResult.ok ? <CheckCircle size={15} className="mt-0.5 shrink-0" /> : <AlertTriangle size={15} className="mt-0.5 shrink-0" />}
                {lastResult.msg}
              </div>
            )}
          </div>
        </div>

        {/* Right — Preview + Log */}
        <div className="col-span-5 space-y-4">

          {/* Live Preview */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Email Preview</p>
            <div className="rounded-xl border border-zinc-200 overflow-hidden text-xs">
              {/* Mock email chrome */}
              <div className="bg-[#111111] px-4 py-3 text-center">
                <p className="text-[#EAB308] font-bold text-[10px] uppercase tracking-widest">LogiTrack AI</p>
                <p className="text-white font-bold mt-0.5">Fleet Alert System</p>
              </div>
              <div className={`px-4 py-2 border-b-2 flex items-center gap-2 ${selectedType.bg}`} style={{ borderColor: selectedType.color + '40' }}>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white`} style={{ background: selectedType.color === 'text-blue-700' ? '#2563eb' : selectedType.color === 'text-amber-700' ? '#d97706' : selectedType.color === 'text-red-700' ? '#dc2626' : selectedType.color === 'text-purple-700' ? '#7c3aed' : '#0891b2' }}>
                  {selectedType.icon} {selectedType.label.toUpperCase()}
                </span>
                <span className="text-zinc-400">{new Date().toLocaleDateString('en-IN')}</span>
              </div>
              <div className="px-4 py-3 bg-white space-y-2">
                <p className="text-zinc-400">To: <span className="font-medium text-zinc-700">{selectedGroup.label}{recipientGroup === 'custom' && customEmail ? ` (${customEmail})` : ''}</span></p>
                <p className="font-bold text-zinc-800">{subject || 'Your alert subject will appear here…'}</p>
                <div className="bg-zinc-50 border-l-4 rounded-r px-3 py-2" style={{ borderColor: selectedType.color === 'text-blue-700' ? '#2563eb' : selectedType.color === 'text-amber-700' ? '#d97706' : selectedType.color === 'text-red-700' ? '#dc2626' : selectedType.color === 'text-purple-700' ? '#7c3aed' : '#0891b2' }}>
                  <p className="text-zinc-600 leading-relaxed whitespace-pre-wrap">{message || 'Your message will appear here…'}</p>
                </div>
                <p className="text-zinc-400 text-[10px]">Sent by Fleet Manager · LogiTrack AI</p>
              </div>
            </div>
          </div>

          {/* Sent log */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Bell size={11} /> Sent History
            </p>
            {sentLog.length === 0 ? (
              <div className="text-center py-6 text-zinc-400 text-xs bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                No alerts sent yet this session
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {sentLog.map(log => {
                  const t = ALERT_TYPES.find(a => a.value === log.alertType)!
                  return (
                    <div key={log.id} className={`rounded-xl border p-3 ${t.bg} ${t.border}`}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-[10px] font-bold ${t.color}`}>{t.icon} {t.label.toUpperCase()}</span>
                        <span className="text-[10px] text-zinc-400 flex items-center gap-1"><Clock size={9} />{log.timestamp}</span>
                      </div>
                      <p className={`text-xs font-semibold ${t.color} truncate`}>{log.subject}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-zinc-500">→ {log.recipientGroup === 'custom' ? log.customEmail : log.recipientGroup}</span>
                        <span className={`text-[10px] font-bold flex items-center gap-0.5 ${log.status === 'success' ? 'text-green-600' : log.status === 'partial' ? 'text-amber-600' : 'text-red-600'}`}>
                          {log.status === 'success' ? <><CheckCircle size={9} /> {log.sent} sent</> : log.status === 'partial' ? <><Zap size={9} /> partial</> : 'failed'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
