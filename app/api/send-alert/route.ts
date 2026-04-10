import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Gmail SMTP transporter — app password from .env.local
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ALERT_EMAIL_USER,
    pass: process.env.ALERT_EMAIL_PASS,
  },
})

// Mock recipient registry — in production, pull from Firestore users collection
const ROLE_EMAILS: Record<string, { name: string; email: string; role: string }[]> = {
  operators: [
    { name: 'Operator – Mumbai Hub',     email: 'reachpavankumar0@gmail.com', role: 'Operator' },
    { name: 'Operator – Delhi Hub',      email: 'reachpavankumar0@gmail.com', role: 'Operator' },
  ],
  drivers: [
    { name: 'Arjun Singh (Van – D1)',    email: 'reachpavankumar0@gmail.com', role: 'Driver'   },
    { name: 'Priya Sharma (Truck – D2)', email: 'reachpavankumar0@gmail.com', role: 'Driver'   },
    { name: 'Ravi Kumar (Bike – D3)',    email: 'reachpavankumar0@gmail.com', role: 'Driver'   },
  ],
}

function buildHtml(type: string, subject: string, message: string, recipientName: string, senderName: string) {
  const typeStyles: Record<string, { color: string; bg: string; icon: string; label: string }> = {
    info:      { color: '#2563eb', bg: '#eff6ff', icon: 'ℹ️', label: 'Information' },
    warning:   { color: '#d97706', bg: '#fffbeb', icon: '⚠️', label: 'Warning'     },
    emergency: { color: '#dc2626', bg: '#fef2f2', icon: '🚨', label: 'Emergency'   },
    route:     { color: '#7c3aed', bg: '#f5f3ff', icon: '🗺️', label: 'Route Update' },
    weather:   { color: '#0891b2', bg: '#ecfeff', icon: '🌧️', label: 'Weather Alert' },
  }
  const style = typeStyles[type] ?? typeStyles.info
  const now = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short',
  })

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#111111;padding:24px 32px;text-align:center;">
            <p style="margin:0;color:#EAB308;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">LogiTrack AI</p>
            <h1 style="margin:6px 0 0;color:#fff;font-size:22px;font-weight:700;">Fleet Alert System</h1>
          </td>
        </tr>

        <!-- Alert type badge -->
        <tr>
          <td style="background:${style.bg};padding:16px 32px;border-bottom:2px solid ${style.color}20;">
            <span style="background:${style.color};color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:99px;text-transform:uppercase;letter-spacing:1px;">
              ${style.icon} ${style.label}
            </span>
            <span style="margin-left:12px;color:#6b7280;font-size:12px;">${now} IST</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 4px;color:#6b7280;font-size:13px;">Hello, <strong>${recipientName}</strong></p>
            <h2 style="margin:8px 0 16px;color:#111111;font-size:18px;font-weight:700;">${subject}</h2>
            <div style="background:#f9fafb;border-left:4px solid ${style.color};border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:20px;">
              <p style="margin:0;color:#374151;font-size:14px;line-height:1.7;white-space:pre-wrap;">${message}</p>
            </div>
            <p style="margin:0;color:#9ca3af;font-size:12px;">This alert was sent by <strong>${senderName}</strong> via the LogiTrack AI admin panel. Please act on this immediately if it is an emergency or route-related update.</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:11px;">LogiTrack AI · Logistics Optimization System · Do not reply to this email</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      recipientGroup, // 'operators' | 'drivers' | 'all' | 'custom'
      customEmail,    // used when recipientGroup === 'custom'
      alertType,      // 'info' | 'warning' | 'emergency' | 'route' | 'weather'
      subject,
      message,
      senderName = 'Fleet Manager',
    } = body

    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })
    }

    // Build recipient list
    let recipients: { name: string; email: string; role: string }[] = []

    if (recipientGroup === 'custom' && customEmail) {
      recipients = [{ name: 'Team Member', email: customEmail, role: 'Custom' }]
    } else if (recipientGroup === 'all') {
      recipients = [...ROLE_EMAILS.operators, ...ROLE_EMAILS.drivers]
    } else if (ROLE_EMAILS[recipientGroup]) {
      recipients = ROLE_EMAILS[recipientGroup]
    }

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No valid recipients found' }, { status: 400 })
    }

    // Deduplicate by email (multiple roles may share demo email)
    const seen = new Set<string>()
    const unique = recipients.filter(r => {
      if (seen.has(r.email)) return false
      seen.add(r.email)
      return true
    })

    // Send one email per unique address
    const results = await Promise.allSettled(
      unique.map(recipient =>
        transporter.sendMail({
          from: `"LogiTrack AI Alerts" <${process.env.ALERT_EMAIL_USER}>`,
          to: recipient.email,
          subject: `[LogiTrack] ${subject}`,
          html: buildHtml(alertType, subject, message, recipient.name, senderName),
        })
      )
    )

    const sent    = results.filter(r => r.status === 'fulfilled').length
    const failed  = results.filter(r => r.status === 'rejected').length
    const errors  = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map(r => r.reason?.message ?? 'Unknown error')

    return NextResponse.json({
      success: sent > 0,
      sent,
      failed,
      total: unique.length,
      recipients: unique.map(r => r.email),
      errors: errors.length ? errors : undefined,
    })
  } catch (err) {
    console.error('[send-alert]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
