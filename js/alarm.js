/* Alarme: verifica a cada 15 s se há dose vencida e avisa o usuário */
const Alarm = {
  seen: new Set(), timer: null, onRing: null,
  start(cb) { this.onRing = cb; this.stop(); this.timer = setInterval(() => this.check(), 15000); this.check(); },
  stop() { clearInterval(this.timer); },
  check() {
    if (!Auth.current()) return;
    const now = nowHM(), nowMs = Date.now();
    const due = Doses.today().find(d => {
      if (d.taken || d.time > now) return false;
      const [h, m] = d.time.split(':').map(Number), dt = new Date(); dt.setHours(h, m, 0, 0);
      if (nowMs - dt.getTime() > 60 * 60000) return false;          // ignora doses com mais de 1 h
      if (d.snoozeUntil && nowMs < d.snoozeUntil) return false;     // adiada
      return !this.seen.has(d.id + '|' + (d.snoozeUntil || 0));
    });
    if (due) { this.seen.add(due.id + '|' + (due.snoozeUntil || 0)); this.ring(due); }
  },
  ring(dose) {
    this.beep();
    if ('Notification' in window && Notification.permission === 'granted')
      new Notification('Hora do remédio!', { body: `${dose.med.name} · ${dose.med.dose} (${dose.time})` });
    if (this.onRing) this.onRing(dose);
  },
  beep() {
    try {
      const c = new (window.AudioContext || window.webkitAudioContext)();
      [0, .3, .6].forEach(t => { const o = c.createOscillator(), g = c.createGain();
        o.frequency.value = 880; g.gain.value = .15; o.connect(g); g.connect(c.destination);
        o.start(c.currentTime + t); o.stop(c.currentTime + t + .18); });
    } catch {}
  },
  askPermission() { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); }
};
