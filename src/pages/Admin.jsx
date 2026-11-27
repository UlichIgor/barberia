import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays, Scissors, Images, Star, LayoutDashboard, LogOut, LockKeyhole,
  Plus, Search, Check, X, Clock3, Phone, UserRound, Trash2, Eye, EyeOff,
  Upload, RefreshCw, Settings, Menu, ChevronDown
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { services as defaultServices } from '../data/services';

const nav = [
  { id: 'overview', label: 'Огляд', icon: LayoutDashboard },
  { id: 'appointments', label: 'Записи', icon: CalendarDays },
  { id: 'services', label: 'Послуги', icon: Scissors },
  { id: 'portfolio', label: 'Галерея', icon: Images },
  { id: 'reviews', label: 'Відгуки', icon: Star },
  { id: 'settings', label: 'Графік роботи', icon: Settings },
];
const statusLabels = { pending: 'Очікує', confirmed: 'Підтверджено', completed: 'Виконано', cancelled: 'Скасовано', published: 'Опубліковано', hidden: 'Приховано' };
const money = (value) => `${Number(value || 0).toFixed(2).replace(/\.00$/, '')} €`;
const dateTime = (value) => new Date(value).toLocaleString('uk-UA', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Madrid' });

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError('Не вдалося увійти. Перевір email і пароль.'); setBusy(false); return; }
    if (data.user?.app_metadata?.role !== 'admin') {
      await supabase.auth.signOut(); setError('Цей обліковий запис не має прав адміністратора.'); setBusy(false); return;
    }
    onLogin(data.user); setBusy(false);
  }
  return <div className="adminLogin"><div className="adminLoginCard">
    <img src={`${import.meta.env.BASE_URL}images/yaro-logo.webp`} alt="YARO Barberia"/>
    <p className="adminEyebrow">YARO BARBERIA · CONTROL PANEL</p><h1>ВХІД ДО <em>ПАНЕЛІ.</em></h1>
    <p className="adminMuted">Авторизований доступ лише для майстра.</p>
    <form onSubmit={submit}>
      <label>EMAIL<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="master@example.com" required autoComplete="username"/></label>
      <label>ПАРОЛЬ<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••" required autoComplete="current-password"/></label>
      {error && <p className="adminError">{error}</p>}
      <button className="adminPrimary" disabled={busy}>{busy ? 'ВХІД…' : <><LockKeyhole size={16}/> УВІЙТИ ДО ПАНЕЛІ</>}</button>
    </form>
    <span className="adminLoginFoot">SECURE ACCESS · YARO</span>
  </div></div>;
}

export default function Admin() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [section, setSection] = useState('overview');
  const [mobileNav, setMobileNav] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [serviceRows, setServiceRows] = useState([]);
  const [works, setWorks] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceForm, setServiceForm] = useState(null);
  const [workTitle, setWorkTitle] = useState('');
  const [workFile, setWorkFile] = useState(null);
  const [reviewFilter, setReviewFilter] = useState('all');

  useEffect(() => {
    if (!isSupabaseConfigured) { setAuthReady(true); return; }
    supabase.auth.getSession().then(({ data }) => {
      const current = data.session?.user;
      if (current?.app_metadata?.role === 'admin') setUser(current);
      else if (current) supabase.auth.signOut();
      setAuthReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const current = session?.user;
      setUser(current?.app_metadata?.role === 'admin' ? current : null);
      setAuthReady(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true); setNotice('');
    const [a, s, w, r] = await Promise.all([
      supabase.from('barber_appointments').select('*, barber_services(name, price, duration_minutes)').order('starts_at', { ascending: false }),
      supabase.from('barber_services').select('*').order('name'),
      supabase.from('barber_portfolio').select('*').order('created_at', { ascending: false }),
      supabase.from('barber_reviews').select('*').order('created_at', { ascending: false }),
    ]);
    const firstError = [a, s, w, r].find(x => x.error)?.error;
    if (firstError) setNotice(`Помилка завантаження: ${firstError.message}`);
    setAppointments(a.data || []); setServiceRows(s.data || []); setWorks(w.data || []); setReviews(r.data || []);
    setLoading(false);
  }, [user]);
  useEffect(() => { loadData(); }, [loadData]);

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' });
  const stats = useMemo(() => ({
    today: appointments.filter(a => a.starts_at && new Date(a.starts_at).toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' }) === today && a.status !== 'cancelled').length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    revenue: appointments.filter(a => a.status === 'completed').reduce((sum, a) => sum + Number(a.barber_services?.price || 0), 0),
  }), [appointments, today]);

  async function updateAppointment(id, status) {
    const { error } = await supabase.from('barber_appointments').update({ status }).eq('id', id);
    if (error) setNotice(error.message); else { setNotice('Статус запису оновлено.'); loadData(); }
  }
  async function saveService(event) {
    event.preventDefault();
    const row = { id: serviceForm.id.trim(), name: serviceForm.name.trim(), description: serviceForm.description.trim(), duration_minutes: Number(serviceForm.duration_minutes), price: Number(serviceForm.price), active: serviceForm.active };
    const { error } = await supabase.from('barber_services').upsert(row);
    if (error) setNotice(error.message); else { setServiceForm(null); setNotice('Послугу збережено.'); loadData(); }
  }
  async function toggleService(row) {
    const { error } = await supabase.from('barber_services').update({ active: !row.active }).eq('id', row.id);
    if (error) setNotice(error.message); else loadData();
  }
  async function uploadWork(event) {
    event.preventDefault();
    if (!workFile) { setNotice('Спочатку обери фотографію.'); return; }
    if (!workFile.type.startsWith('image/') || workFile.size > 6 * 1024 * 1024) { setNotice('Потрібне зображення розміром до 6 МБ.'); return; }
    const ext = workFile.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('barber-portfolio').upload(path, workFile, { upsert: false, contentType: workFile.type });
    if (uploadError) { setNotice(uploadError.message); return; }
    const { data } = supabase.storage.from('barber-portfolio').getPublicUrl(path);
    const { error } = await supabase.from('barber_portfolio').insert({ title: workTitle.trim() || 'Нова робота', image_url: data.publicUrl, storage_path: path, published: true });
    if (error) { await supabase.storage.from('barber-portfolio').remove([path]); setNotice(error.message); return; }
    setWorkTitle(''); setWorkFile(null); event.target.reset(); setNotice('Фотографію опубліковано в галереї.'); loadData();
  }
  async function toggleWork(row) {
    const { error } = await supabase.from('barber_portfolio').update({ published: !row.published }).eq('id', row.id);
    if (error) setNotice(error.message); else loadData();
  }
  async function deleteWork(row) {
    if (!window.confirm('Видалити цю роботу з галереї?')) return;
    const { error } = await supabase.from('barber_portfolio').delete().eq('id', row.id);
    if (error) { setNotice(error.message); return; }
    if (row.storage_path) await supabase.storage.from('barber-portfolio').remove([row.storage_path]);
    setNotice('Роботу видалено.'); loadData();
  }
  async function updateReview(id, patch) {
    const { error } = await supabase.from('barber_reviews').update(patch).eq('id', id);
    if (error) setNotice(error.message); else loadData();
  }
  async function deleteReview(id) {
    if (!window.confirm('Видалити цей відгук без можливості відновлення?')) return;
    const { error } = await supabase.from('barber_reviews').delete().eq('id', id);
    if (error) setNotice(error.message); else loadData();
  }
  async function logout() { await supabase.auth.signOut(); setUser(null); }

  if (!isSupabaseConfigured) return <div className="adminSetup"><LockKeyhole size={35}/><p className="adminEyebrow">YARO · ADMIN SETUP</p><h1>ПІДКЛЮЧИМО <em>БАЗУ ДАНИХ.</em></h1><p>Адмінпанель підготовлена для Supabase, але в цьому проєкті ще не задані VITE_SUPABASE_URL та VITE_SUPABASE_PUBLISHABLE_KEY. Спочатку потрібно створити окремий Supabase-проєкт BARBERIA та застосувати SQL-міграцію з архіву.</p></div>;
  if (!authReady) return <div className="adminLoading"><RefreshCw className="spin"/> Завантаження панелі…</div>;
  if (!user) return <Login onLogin={setUser}/>;

  const filteredAppointments = appointments.filter(a => (statusFilter === 'all' || a.status === statusFilter) && `${a.client_name} ${a.client_phone} ${a.barber_services?.name || ''}`.toLowerCase().includes(search.toLowerCase()));
  const visibleReviews = reviews.filter(r => reviewFilter === 'all' || r.status === reviewFilter);
  const currentTitle = nav.find(n => n.id === section)?.label || 'Огляд';

  return <div className="adminShell">
    <aside className={`adminSidebar ${mobileNav ? 'isOpen' : ''}`}>
      <a className="adminBrand" href={`${import.meta.env.BASE_URL}#/`}><img src={`${import.meta.env.BASE_URL}images/yaro-logo.webp`}/><span>YARO<small>BARBERIA ADMIN</small></span></a>
      <div className="adminNavLabel">WORKSPACE</div>
      <nav>{nav.map(item => <button key={item.id} className={section === item.id ? 'active' : ''} onClick={() => { setSection(item.id); setMobileNav(false); }}><item.icon size={17}/>{item.label}{item.id === 'appointments' && stats.pending > 0 && <b>{stats.pending}</b>}</button>)}</nav>
      <div className="adminSideBottom"><div className="adminUser"><span className="adminUserAvatar">Y</span><div><strong>YARO MASTER</strong><small>{user.email}</small></div></div><button className="adminLogout" onClick={logout}><LogOut size={16}/> Вийти</button><a href={`${import.meta.env.BASE_URL}#/`} className="backSite">← Повернутися на сайт</a></div>
    </aside>
    <main className="adminMain">
      <header className="adminTopbar"><button className="adminMobileMenu" onClick={() => setMobileNav(v => !v)}><Menu/></button><div><span className="adminEyebrow">YARO BARBERIA / CONTROL</span><h1>{currentTitle}</h1></div><div className="adminTopActions"><span className="adminLive"><i/> СИСТЕМА АКТИВНА</span><button onClick={loadData} title="Оновити дані"><RefreshCw size={17}/></button></div></header>
      {notice && <div className="adminNotice"><span>{notice}</span><button onClick={() => setNotice('')}><X size={15}/></button></div>}
      {loading && <div className="adminLoading small"><RefreshCw className="spin"/> Оновлення даних…</div>}
      {section === 'overview' && <section className="adminContent"><div className="adminWelcome"><div><p className="adminEyebrow">ПАНЕЛЬ КЕРУВАННЯ</p><h2>Вітаємо, <em>YARO.</em></h2><p>Ось що відбувається у твоєму барбершопі сьогодні.</p></div><div className="welcomeDate">{new Date().toLocaleDateString('uk-UA', { dateStyle: 'full' })}</div></div>
        <div className="adminStats"><Stat icon={CalendarDays} label="Записів сьогодні" value={stats.today}/><Stat icon={Clock3} label="Очікують підтвердження" value={stats.pending}/><Stat icon={Check} label="Підтверджено" value={stats.confirmed}/><Stat icon={Star} label="Виручка виконаних" value={money(stats.revenue)}/></div>
        <div className="adminPanel"><div className="adminPanelHead"><div><p className="adminEyebrow">LATEST ACTIVITY</p><h3>ОСТАННІ ЗАПИСИ</h3></div><button className="adminTextButton" onClick={() => setSection('appointments')}>Усі записи ↗</button></div><AppointmentTable rows={appointments.slice(0, 6)} onStatus={updateAppointment}/></div>
        <div className="adminQuickGrid"><Quick icon={Scissors} title="Послуги" text={`${serviceRows.length} позицій у каталозі`} onClick={() => setSection('services')}/><Quick icon={Images} title="Галерея" text={`${works.filter(w => w.published).length} опублікованих робіт`} onClick={() => setSection('portfolio')}/><Quick icon={Star} title="Відгуки" text={`${reviews.filter(r => r.status === 'pending').length} очікують модерації`} onClick={() => setSection('reviews')}/></div>
      </section>}
      {section === 'appointments' && <section className="adminContent"><div className="adminToolbar"><div className="adminSearch"><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Пошук за ім'ям, телефоном, послугою…"/></div><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="all">Усі статуси</option>{['pending','confirmed','completed','cancelled'].map(s => <option value={s} key={s}>{statusLabels[s]}</option>)}</select></div><div className="adminPanel"><div className="adminPanelHead"><div><p className="adminEyebrow">BOOKING MANAGEMENT</p><h3>ЗАПИСИ КЛІЄНТІВ <span className="adminCount">{filteredAppointments.length}</span></h3></div></div><AppointmentTable rows={filteredAppointments} onStatus={updateAppointment}/></div></section>}
      {section === 'services' && <section className="adminContent"><div className="adminPanel"><div className="adminPanelHead"><div><p className="adminEyebrow">SERVICE MENU</p><h3>ПОСЛУГИ ТА ВАРТІСТЬ</h3></div><button className="adminGoldButton" onClick={() => setServiceForm({ id: '', name: '', description: '', duration_minutes: 30, price: 20, active: true })}><Plus size={15}/> ДОДАТИ ПОСЛУГУ</button></div><div className="adminServiceList">{serviceRows.map(s => <div className="adminServiceRow" key={s.id}><div className="adminServiceIcon"><Scissors size={18}/></div><div className="adminServiceInfo"><strong>{s.name}</strong><small>{s.description || 'Послуга YARO'} · {s.duration_minutes} хв</small></div><strong className="adminServicePrice">{money(s.price)}</strong><span className={`adminStatus ${s.active ? 'published' : 'hidden'}`}>{s.active ? 'Активна' : 'Прихована'}</span><button className="adminIconButton" onClick={() => setServiceForm({ ...s })}>Редагувати</button><button className="adminIconButton" onClick={() => toggleService(s)}>{s.active ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div>)}</div></div>
        {serviceForm && <div className="adminModalBackdrop" onClick={() => setServiceForm(null)}><form className="adminModal" onSubmit={saveService} onClick={e => e.stopPropagation()}><button type="button" className="adminModalClose" onClick={() => setServiceForm(null)}><X/></button><p className="adminEyebrow">SERVICE EDITOR</p><h3>{serviceRows.some(s => s.id === serviceForm.id) ? 'РЕДАГУВАТИ ПОСЛУГУ' : 'НОВА ПОСЛУГА'}</h3><label>Системний ID<input value={serviceForm.id} disabled={serviceRows.some(s => s.id === serviceForm.id)} onChange={e => setServiceForm({ ...serviceForm, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} required/></label><label>Назва<input value={serviceForm.name} onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })} required/></label><label>Опис<textarea value={serviceForm.description || ''} onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })}/></label><div className="adminFormCols"><label>Ціна (€)<input type="number" min="0" step="0.5" value={serviceForm.price} onChange={e => setServiceForm({ ...serviceForm, price: e.target.value })} required/></label><label>Тривалість (хв)<input type="number" min="5" max="240" step="5" value={serviceForm.duration_minutes} onChange={e => setServiceForm({ ...serviceForm, duration_minutes: e.target.value })} required/></label></div><label className="adminCheck"><input type="checkbox" checked={serviceForm.active} onChange={e => setServiceForm({ ...serviceForm, active: e.target.checked })}/> Послуга активна на сайті</label><button className="adminPrimary">ЗБЕРЕГТИ ПОСЛУГУ</button></form></div>}
      </section>}
      {section === 'portfolio' && <section className="adminContent"><div className="adminPanel"><div className="adminPanelHead"><div><p className="adminEyebrow">MASTER PORTFOLIO</p><h3>ГАЛЕРЕЯ РОБІТ</h3></div><span className="adminCount">{works.length} фото</span></div><form className="adminUploadForm" onSubmit={uploadWork}><label className="adminFilePick"><Upload size={20}/><span>{workFile ? workFile.name : 'ОБРАТИ ФОТОГРАФІЮ'}</span><small>JPG, PNG, WEBP · до 6 МБ</small><input type="file" accept="image/*" onChange={e => setWorkFile(e.target.files?.[0] || null)} required/></label><input value={workTitle} onChange={e => setWorkTitle(e.target.value)} placeholder="Назва роботи (необов'язково)"/><button className="adminGoldButton"><Plus size={15}/> ЗАВАНТАЖИТИ</button></form><div className="adminWorkGrid">{works.map(w => <article className="adminWorkCard" key={w.id}><img src={w.image_url} alt={w.title}/><div><strong>{w.title}</strong><span className={`adminStatus ${w.published ? 'published' : 'hidden'}`}>{w.published ? 'Опубліковано' : 'Приховано'}</span></div><footer><button onClick={() => toggleWork(w)}>{w.published ? <><EyeOff size={14}/> Приховати</> : <><Eye size={14}/> Опублікувати</>}</button><button className="danger" onClick={() => deleteWork(w)}><Trash2 size={14}/> Видалити</button></footer></article>)}</div>{works.length === 0 && <p className="adminEmpty">Галерея поки порожня. Додай першу роботу.</p>}</div></section>}
      {section === 'reviews' && <section className="adminContent"><div className="adminToolbar"><select value={reviewFilter} onChange={e => setReviewFilter(e.target.value)}><option value="all">Усі відгуки</option><option value="pending">Очікують модерації</option><option value="published">Опубліковані</option><option value="hidden">Приховані</option></select></div><div className="adminReviewList">{visibleReviews.map(r => <article className="adminReviewCard" key={r.id}><div className="adminReviewHead"><div><strong>{r.client_name}</strong><small>{dateTime(r.created_at)}</small></div><span className={`adminStatus ${r.status}`}>{statusLabels[r.status] || r.status}</span></div><div className="adminStars">{'★'.repeat(r.rating || 5)}<span>{'★'.repeat(5-(r.rating || 5))}</span></div><p>{r.message}</p><footer>{r.status !== 'published' && <button onClick={() => updateReview(r.id, { status: 'published' })}><Check size={14}/> Опублікувати</button>}{r.status === 'published' && <button onClick={() => updateReview(r.id, { status: 'hidden' })}><EyeOff size={14}/> Приховати</button>}{r.status !== 'pending' && <button onClick={() => updateReview(r.id, { status: 'pending' })}>На модерацію</button>}<button className="danger" onClick={() => deleteReview(r.id)}><Trash2 size={14}/> Видалити</button></footer></article>)}{visibleReviews.length === 0 && <p className="adminEmpty">Відгуків у цій категорії немає.</p>}</div></section>}
      {section === 'settings' && <section className="adminContent"><div className="adminPanel adminSchedule"><p className="adminEyebrow">WORKING HOURS</p><h3>ГРАФІК YARO</h3><div className="scheduleLine"><span>Понеділок – П’ятниця</span><strong>09:00 – 19:00</strong></div><div className="scheduleLine"><span>Субота</span><strong className="mutedValue">Вихідний</strong></div><div className="scheduleLine"><span>Неділя</span><strong className="mutedValue">Вихідний</strong></div><div className="scheduleLine"><span>Крок між записами</span><strong>30 хвилин</strong></div><p className="adminHint">Поточний графік відповідає налаштуванням форми онлайн-запису. Редагування графіка та винятків (відпустка, вихідні) буде винесено в окремий календарний модуль.</p></div></section>}
    </main>
  </div>;
}

function Stat({ icon: Icon, label, value }) { return <div className="adminStat"><span><Icon size={19}/></span><small>{label}</small><strong>{value}</strong></div>; }
function Quick({ icon: Icon, title, text, onClick }) { return <button className="adminQuick" onClick={onClick}><Icon size={20}/><strong>{title}</strong><span>{text}</span><b>↗</b></button>; }
function AppointmentTable({ rows, onStatus }) { return <div className="adminTableWrap"><table className="adminTable"><thead><tr><th>КЛІЄНТ</th><th>ПОСЛУГА</th><th>ДАТА / ЧАС</th><th>СТАТУС</th><th>ДІЇ</th></tr></thead><tbody>{rows.map(a => <tr key={a.id}><td><strong>{a.client_name}</strong><small><Phone size={11}/> {a.client_phone}</small></td><td>{a.barber_services?.name || a.service_id}</td><td>{dateTime(a.starts_at)}</td><td><span className={`adminStatus ${a.status}`}>{statusLabels[a.status] || a.status}</span></td><td><select aria-label="Змінити статус запису" value={a.status} onChange={e => onStatus(a.id, e.target.value)}><option value="pending">Очікує</option><option value="confirmed">Підтверджено</option><option value="completed">Виконано</option><option value="cancelled">Скасовано</option></select></td></tr>)}</tbody></table>{rows.length === 0 && <p className="adminEmpty">Записів поки немає.</p>}</div>; }
