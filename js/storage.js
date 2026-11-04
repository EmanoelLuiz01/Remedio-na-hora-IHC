/* Persistência (localStorage), autenticação, remédios e doses */
const DB = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem('rnh_' + k)); return v ?? d; } catch { return d; } },
  set(k, v) { localStorage.setItem('rnh_' + k, JSON.stringify(v)); }
};
const enc = s => btoa(unescape(encodeURIComponent(s)));

const Auth = {
  users() { return DB.get('users', []); },
  register(name, email, pass) {
    email = email.trim().toLowerCase();
    if (this.users().some(u => u.email === email)) return { error: 'Este e-mail já está cadastrado. Toque em Voltar e use Entrar.' };
    const u = { id: Date.now().toString(36), name: name.trim(), email, pass: enc(pass) };
    DB.set('users', [...this.users(), u]); DB.set('session', u.id);
    return { ok: true };
  },
  login(email, pass) {
    const u = this.users().find(u => u.email === email.trim().toLowerCase() && u.pass === enc(pass));
    if (!u) return { error: 'E-mail ou senha incorretos. Confira e tente de novo.' };
    DB.set('session', u.id); return { ok: true };
  },
  logout() { DB.set('session', null); },
  current() { const id = DB.get('session', null); return this.users().find(u => u.id === id) || null; }
};

const pad = n => String(n).padStart(2, '0');
const dateKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayKey = () => dateKey(new Date());
const nowHM = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fmt = k => k.split('-').reverse().slice(0, 2).join('/');   // AAAA-MM-DD -> DD/MM
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/* Remédio: { id, userId, name, dose, mode:'fixed'|'interval', every, times[], days[0-6], start, end } */
const Meds = {
  all() { const u = Auth.current(); return u ? DB.get('meds', []).filter(m => m.userId === u.id) : []; },
  add(data) {
    const m = { id: Date.now().toString(36), userId: Auth.current().id, ...data };
    m.times = [...m.times].sort();
    DB.set('meds', [...DB.get('meds', []), m]); return m;
  },
  remove(id) { DB.set('meds', DB.get('meds', []).filter(m => m.id !== id)); },
  find(id) { return this.all().find(m => m.id === id); },
  /* o remédio vale nesta data? (período + dia da semana) */
  appliesOn(m, key) {
    if (m.start && key < m.start) return false;
    if (m.end && key > m.end) return false;
    const [y, mo, d] = key.split('-').map(Number);
    return !m.days || m.days.includes(new Date(y, mo - 1, d).getDay());
  },
  describe(m) {
    const dias = !m.days || m.days.length === 7 ? 'Todos os dias' : m.days.map(d => DIAS[d]).join(', ');
    return dias + (m.end ? ` · até ${fmt(m.end)}` : '') + (m.mode === 'interval' ? ` · a cada ${m.every} h` : '');
  }
};

const Doses = {
  log() { return DB.get('log', {}); },
  mark(id, patch) { const l = this.log(); l[id] = { ...(l[id] || {}), ...patch }; DB.set('log', l); },
  take(id) { this.mark(id, { taken: true, snoozeUntil: null }); },
  snooze(id, min = 10) { this.mark(id, { snoozeUntil: Date.now() + min * 60000 }); },
  /* Doses de uma data. Estado: taken | next | late | pending */
  forDate(key) {
    const log = this.log(), now = nowHM(), tk = todayKey(), list = [];
    Meds.all().filter(m => Meds.appliesOn(m, key)).forEach(m => m.times.forEach(t => {
      const id = `${m.id}|${key}|${t}`, l = log[id] || {};
      list.push({ id, med: m, time: t, date: key, taken: !!l.taken, snoozeUntil: l.snoozeUntil });
    }));
    list.sort((a, b) => a.time.localeCompare(b.time));
    const next = key === tk ? list.find(d => !d.taken && d.time >= now) : null;
    list.forEach(d => d.state = d.taken ? 'taken' : d === next ? 'next'
      : (key < tk || (key === tk && d.time < now)) ? 'late' : 'pending');
    return list;
  },
  today() { return this.forDate(todayKey()); },
  /* Próxima dose de um remédio (procura nos próximos 15 dias) */
  nextDose(m) {
    const now = nowHM();
    for (let i = 0; i < 15; i++) {
      const d = new Date(); d.setDate(d.getDate() + i);
      const k = dateKey(d); if (!Meds.appliesOn(m, k)) continue;
      const t = m.times.find(t => i > 0 || t >= now);
      if (t) return { date: k, time: t, i };
    }
    return null;
  }
};
