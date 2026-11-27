import { useEffect, useMemo, useState } from 'react';
import { Check, Clock3, CalendarDays } from 'lucide-react';
import PageIntro from '../components/PageIntro';
import { services as defaultServices } from '../data/services';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const WORKING_DAYS = [1, 2, 3, 4, 5, 6]; // Monday–Saturday
const OPEN_MINUTES = 9 * 60;
const CLOSE_MINUTES = 20 * 60;
const STEP_MINUTES = 30;
const today = new Date();
const localDate = (d) => {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const minDate = localDate(today);
const fmtTime = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;
function madridLocalToIso(date, time) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const target = Date.UTC(year, month - 1, day, hour, minute);
  const formatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  let guess = target;
  for (let i = 0; i < 3; i++) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(guess)).filter(p => p.type !== 'literal').map(p => [p.type, Number(p.value)]));
    const represented = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
    guess += target - represented;
  }
  return new Date(guess).toISOString();
}
function madridDateTime(iso) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(iso));
  const p = Object.fromEntries(parts.filter(x => x.type !== 'literal').map(x => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

export default function Booking() {
  const [services, setServices] = useState(defaultServices);
  const [bookings, setBookings] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [service, setService] = useState(sessionStorage.getItem('barberia-service') || defaultServices[0].id);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const item = services.find((s) => s.id === service) || services[0];

  const dayIsOpen = (value) => {
    if (!value) return false;
    const [y, m, d] = value.split('-').map(Number);
    return WORKING_DAYS.includes(new Date(y, m - 1, d).getDay() || 7);
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      try { setBookings(JSON.parse(localStorage.getItem('barberia-demo-bookings') || '[]')); } catch { setBookings([]); }
      return;
    }
    let active = true;
    supabase.from('barber_services').select('id,name,description,duration_minutes,price').eq('active', true).order('sort_order').then(({ data }) => {
      if (active && data?.length) setServices(data.map(s => ({ ...s, duration: s.duration_minutes })));
    });
    if (date) {
      setAvailabilityLoading(true);
      const start = madridLocalToIso(date, '00:00');
      const nextDate = new Date(`${date}T12:00:00`); nextDate.setDate(nextDate.getDate() + 1);
      const next = `${nextDate.getFullYear()}-${String(nextDate.getMonth()+1).padStart(2,'0')}-${String(nextDate.getDate()).padStart(2,'0')}`;
      const end = madridLocalToIso(next, '00:00');
      supabase.rpc('get_barber_busy_slots', { p_day_start: start, p_day_end: end }).then(({ data }) => {
        if (active) { setBookings((data || []).map(row => { const a = madridDateTime(row.starts_at); const b = madridDateTime(row.ends_at); const startMinutes = Number(a.time.slice(0,2))*60 + Number(a.time.slice(3,5)); const endMinutes = Number(b.time.slice(0,2))*60 + Number(b.time.slice(3,5)); return { date: a.date, time: a.time, status: 'confirmed', startMinutes, endMinutes, duration: endMinutes-startMinutes }; })); setAvailabilityLoading(false); }
      });
    } else { setBookings([]); setAvailabilityLoading(false); }
    return () => { active = false; };
  }, [date, sent]);

  const slots = useMemo(() => {
    if (!date || !dayIsOpen(date)) return [];
    const [y, m, d] = date.split('-').map(Number);
    const selectedDay = new Date(y, m - 1, d);
    const now = new Date();
    const sameDay = localDate(now) === date;
    const result = [];
    for (let start = OPEN_MINUTES; start + item.duration <= CLOSE_MINUTES; start += STEP_MINUTES) {
      if (sameDay && start <= now.getHours() * 60 + now.getMinutes()) continue;
      const end = start + item.duration;
      const occupied = bookings.some((b) => b.date === date && b.status !== 'cancelled' && b.status !== 'demo-cancelled' &&
        overlaps(start, end, Number(b.startMinutes ?? (Number(b.time?.slice(0,2) || 0) * 60 + Number(b.time?.slice(3,5) || 0))),
          Number(b.endMinutes ?? ((Number(b.time?.slice(0,2) || 0) * 60 + Number(b.time?.slice(3,5) || 0)) + (b.duration || 30)))));
      if (!occupied) result.push(fmtTime(start));
    }
    return result;
  }, [date, item.duration, bookings]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!dayIsOpen(date)) { setError('Запис доступний з понеділка по суботу.'); return; }
    if (!time || !slots.includes(time)) { setError('Цей час уже недоступний. Обери інший слот.'); return; }
    const startMinutes = Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
    const booking = {
      id: Date.now(), service: item.name, serviceId: item.id, date, time, name: name.trim(), phone: phone.trim(),
      duration: item.duration, startMinutes, endMinutes: startMinutes + item.duration, status: 'pending',
      createdAt: new Date().toISOString()
    };
    const current = isSupabaseConfigured ? bookings : JSON.parse(localStorage.getItem('barberia-demo-bookings') || '[]');
    const conflict = current.some((b) => b.date === date && b.status !== 'cancelled' &&
      overlaps(startMinutes, startMinutes + item.duration,
        Number(b.startMinutes ?? 0), Number(b.endMinutes ?? ((b.startMinutes ?? 0) + (b.duration || 30)))));
    if (conflict) { setError('На жаль, цей час щойно зайняли. Онови вибір.'); setTime(''); return; }
    if (isSupabaseConfigured) {
      const startsAt = madridLocalToIso(date, time);
      const endsAt = madridLocalToIso(date, fmtTime(startMinutes + item.duration));
      const { error: insertError } = await supabase.from('barber_appointments').insert({ service_id: item.id, client_name: name.trim(), client_phone: phone.trim(), starts_at: startsAt, ends_at: endsAt, status: 'pending' });
      if (insertError) { setError(insertError.code === '23P01' ? 'Цей час щойно зайняли. Обери інший слот.' : 'Не вдалося створити запис. Перевір дані та спробуй ще раз.'); return; }
      setSent(true);
    } else {
      localStorage.setItem('barberia-demo-bookings', JSON.stringify([...current, booking]));
      setSent(true);
    }
  }

  return <>
    <PageIntro eyebrow="03 / ONLINE APPOINTMENT" title="ОБЕРИ СВІЙ" accent="ЧАС." description="Обери послугу, робочий день та доступний час. Залиш контакти — майстер зможе підтвердити запит." />
    <section className="section bookingSection">
      <form className="bookingForm" onSubmit={submit}>
        <div className="formStep"><b>01</b><div><h3>ОБЕРИ ПОСЛУГУ</h3><div className="bookingServices">{services.map(s =>
          <button type="button" key={s.id} className={service === s.id ? 'chosen' : ''} onClick={() => { setService(s.id); setTime(''); setSent(false); setError(''); }}>
            <span>{s.name}</span><strong>{s.price} €</strong><small>{s.duration} хв</small>
          </button>)}</div></div></div>
        <div className="formStep"><b>02</b><div><h3><CalendarDays size={15} />　ОБЕРИ ДАТУ</h3>
          <input className="field" type="date" min={minDate} value={date} required onChange={e => { setDate(e.target.value); setTime(''); setSent(false); setError(''); }} />
          <p className="hint">Графік майстра: понеділок — субота, 09:00–20:00. Неділя — вихідний.</p>
          {date && !dayIsOpen(date) && <p className="formError">У цей день майстер не приймає. Обери дату з понеділка по суботу.</p>}
        </div></div>
        <div className="formStep"><b>03</b><div><h3>ДОСТУПНИЙ ЧАС</h3>
          <div className="timeSlots">{slots.map(t => <button type="button" key={t} className={time === t ? 'chosen' : ''} onClick={() => { setTime(t); setSent(false); setError(''); }}>{t}</button>)}</div>
          {availabilityLoading && <p className="hint">Перевіряємо вільний час…</p>}
          {date && dayIsOpen(date) && !availabilityLoading && slots.length === 0 && <p className="hint">На цю дату немає доступних слотів для обраної послуги.</p>}
          <p className="hint">Крок між початками запису — 30 хвилин. Тривалість послуги враховується при перевірці перетинів.</p>
        </div></div>
        <div className="formStep"><b>04</b><div><h3>ТВОЇ КОНТАКТИ</h3><div className="contactGrid">
          <label>ІМ'Я<input className="field" value={name} onChange={e => setName(e.target.value)} placeholder="Твоє ім'я" required minLength={2} /></label>
          <label>ТЕЛЕФОН<input className="field" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+380 __ ___ __ __" required /></label>
        </div><label className="consent"><input type="checkbox" required /> Погоджуюсь на використання контактів для зв'язку щодо запису.</label></div></div>
        <div className="submitRow"><div><small>ОБРАНА ПОСЛУГА</small><strong>{item.name}</strong><span><Clock3 size={13} /> {item.duration} хв · {item.price} €</span></div>
          <button className="btn goldBtn" disabled={sent || !time || availabilityLoading}>{sent ? <><Check size={15} /> ЗАПИТ СТВОРЕНО</> : 'НАДІСЛАТИ ЗАПИТ ↗'}</button>
        </div>
        {error && <p className="formError">{error}</p>}
        {sent && <p className="successMsg">Запит на запис надіслано майстру. Він з'явиться в адміністративній панелі YARO зі статусом «Очікує підтвердження».</p>}
      </form>
    </section>
  </>;
}
