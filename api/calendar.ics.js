import { createClient } from '@supabase/supabase-js';

const TZID = 'Europe/Paris';

function pad2(n) {
  return String(n).padStart(2, '0');
}

function ymdToIcsDate(ymd) {
  // ymd: YYYY-MM-DD
  return String(ymd || '').replace(/-/g, '');
}

function escapeIcsText(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function icsNowUtcStamp() {
  const d = new Date();
  // YYYYMMDDTHHMMSSZ
  return (
    `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}` +
    `T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`
  );
}

function computeEndTime(time, durationHours) {
  // time: "HH:MM"
  const [hh, mm] = String(time || '00:00').split(':').map((v) => parseInt(v, 10));
  const totalMinutes = (Number.isFinite(hh) ? hh : 0) * 60 + (Number.isFinite(mm) ? mm : 0);
  const durMinutes = Math.max(0, Math.round((Number(durationHours) || 1) * 60));
  const end = totalMinutes + durMinutes;
  const endH = Math.floor(end / 60) % 24;
  const endM = end % 60;
  return `${pad2(endH)}:${pad2(endM)}`;
}

function buildRRule(recurrence, ymd) {
  if (!recurrence || recurrence === 'none') return '';
  const baseDate = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(baseDate.getTime())) return '';

  if (recurrence === 'daily') return 'RRULE:FREQ=DAILY';
  if (recurrence === 'weekly') {
    const byday = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][baseDate.getDay()];
    return `RRULE:FREQ=WEEKLY;BYDAY=${byday}`;
  }
  if (recurrence === 'monthly') {
    const bymonthday = baseDate.getDate();
    return `RRULE:FREQ=MONTHLY;BYMONTHDAY=${bymonthday}`;
  }
  if (recurrence === 'yearly') {
    const bymonth = baseDate.getMonth() + 1;
    const bymonthday = baseDate.getDate();
    return `RRULE:FREQ=YEARLY;BYMONTH=${bymonth};BYMONTHDAY=${bymonthday}`;
  }
  return '';
}

function buildIcs(events, { prodId = '-//Application Couple//FR', calName = 'Agenda Couple' } = {}) {
  const lines = [];
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push(`PRODID:${prodId}`);
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:PUBLISH');
  lines.push(`X-WR-CALNAME:${escapeIcsText(calName)}`);

  const dtstamp = icsNowUtcStamp();

  for (const ev of events) {
    const ymd = String(ev?.date || '');
    if (!ymd) continue;

    const uid = `${ev?.id ?? crypto.randomUUID()}@application-couple`;
    const summary = escapeIcsText(ev?.title || 'Événement');
    const description = escapeIcsText(ev?.type ? `Type: ${ev.type}` : '');
    const rrule = buildRRule(ev?.recurrence, ymd);

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`SUMMARY:${summary}`);
    if (description) lines.push(`DESCRIPTION:${description}`);

    const dateIcs = ymdToIcsDate(ymd);
    if (ev?.time) {
      const timeStr = String(ev.time);
      const [hh, mm] = timeStr.split(':');
      const start = `${dateIcs}T${pad2(parseInt(hh, 10) || 0)}${pad2(parseInt(mm, 10) || 0)}00`;
      const endTime = computeEndTime(timeStr, ev?.duration);
      const [eh, em] = endTime.split(':');
      const end = `${dateIcs}T${pad2(parseInt(eh, 10) || 0)}${pad2(parseInt(em, 10) || 0)}00`;
      lines.push(`DTSTART;TZID=${TZID}:${start}`);
      lines.push(`DTEND;TZID=${TZID}:${end}`);
    } else {
      // All-day event: DTEND is exclusive => next day
      const baseDate = new Date(`${ymd}T00:00:00`);
      const next = new Date(baseDate.getTime() + 24 * 60 * 60 * 1000);
      const nextYmd = `${next.getFullYear()}-${pad2(next.getMonth() + 1)}-${pad2(next.getDate())}`;
      lines.push(`DTSTART;VALUE=DATE:${dateIcs}`);
      lines.push(`DTEND;VALUE=DATE:${ymdToIcsDate(nextYmd)}`);
    }

    if (rrule) lines.push(rrule);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

export default async function handler(req, res) {
  try {
    const requiredToken = process.env.CALENDAR_FEED_TOKEN;
    if (requiredToken) {
      const provided = req?.query?.token || req?.headers?.['x-calendar-token'];
      if (provided !== requiredToken) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Unauthorized');
        return;
      }
    }

    const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
    const supabaseKey = (
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      ''
    ).trim();

    if (!supabaseUrl || !supabaseKey) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Supabase is not configured on the server.');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('calendrier_evenements')
      .select('id,date,title,type,time,duration,recurrence');

    if (error) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end(`Supabase error: ${error.message}`);
      return;
    }

    const ics = buildIcs(data || []);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=600');
    res.end(ics);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(`Server error: ${err?.message || String(err)}`);
  }
}

