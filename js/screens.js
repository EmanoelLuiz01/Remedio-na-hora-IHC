/* Telas. Cada função devolve { html, bind(root) } */
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (s, r = document) => r.querySelector(s);
const PILL = '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 20.5a4.95 4.95 0 0 1-7-7l10-10a4.95 4.95 0 0 1 7 7z"/><path d="m8.5 8.5 7 7"/></svg>';
const svg = (p, c) => `<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;

const Screens = {
  welcome: () => ({
    html: `<section class="screen"><div class="center"><div class="logo">${PILL}</div>
      <h1>Remédio na Hora</h1><p class="sub">Seu remédio no horário certo!</p></div>
      <div class="actions"><button class="btn-primary" data-go="login">Entrar</button>
      <button class="btn-outline" data-go="register">Cadastrar</button></div></section>`
  }),

  login: () => ({
    html: `<section class="screen"><div><button class="back" data-go="welcome" aria-label="Voltar">‹</button></div>
      <h2>Entrar</h2>
      <label for="email">E-mail</label><input id="email" type="email" autocomplete="email">
      <label for="pass">Senha</label><input id="pass" type="password" autocomplete="current-password">
      <p class="error" id="err" role="alert"></p>
      <div class="actions"><button class="btn-primary" id="ok">Entrar</button></div></section>`,
    bind(r) {
      $('#ok', r).onclick = () => {
        const res = Auth.login($('#email', r).value, $('#pass', r).value);
        if (res.error) return $('#err', r).textContent = res.error;
        Alarm.askPermission(); go('home');
      };
    }
  }),

  register: () => ({
    html: `<section class="screen"><div><button class="back" data-go="welcome" aria-label="Voltar">‹</button></div>
      <h2>Cadastrar</h2>
      <label for="name">Nome</label><input id="name" autocomplete="name">
      <label for="email">E-mail</label><input id="email" type="email" autocomplete="email">
      <label for="pass">Senha (mínimo 4 caracteres)</label><input id="pass" type="password" autocomplete="new-password">
      <p class="error" id="err" role="alert"></p>
      <div class="actions"><button class="btn-primary" id="ok">Criar conta</button></div></section>`,
    bind(r) {
      $('#ok', r).onclick = () => {
        const n = $('#name', r).value.trim(), e = $('#email', r).value.trim(), p = $('#pass', r).value;
        if (!n || !/^\S+@\S+\.\S+$/.test(e)) return $('#err', r).textContent = 'Preencha seu nome e um e-mail válido.';
        if (p.length < 4) return $('#err', r).textContent = 'A senha precisa ter pelo menos 4 caracteres.';
        const res = Auth.register(n, e, p);
        if (res.error) return $('#err', r).textContent = res.error;
        Alarm.askPermission(); go('home');
      };
    }
  }),

  alarm: id => {
    const d = Doses.today().find(x => x.id === id);
    if (!d) return Screens.home();
    return {
      html: `<section class="screen"><div class="center">
        <div class="icon-circle" style="background:var(--blue-soft)">${svg('<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>', '#2F6FF2')}</div>
        <h1 style="font-size:1.8rem">Hora do remédio!</h1><p class="sub">${esc(d.med.name)} · ${esc(d.med.dose)}</p>
        <p class="sub" style="font-size:1rem">${d.time}</p></div>
        <div class="actions"><button class="btn-primary" id="took">Tomei</button>
        <button class="btn-outline" id="snz">Adiar 10 min</button></div></section>`,
      bind(r) {
        $('#took', r).onclick = () => { Doses.take(id); go('home'); };
        $('#snz', r).onclick = () => { Doses.snooze(id, 10); go('home'); };
      }
    };
  },

  confirm: id => {
    const m = Meds.find(id);
    if (!m) return Screens.meds();
    return {
      html: `<section class="screen"><div class="center">
        <div class="icon-circle" style="background:var(--red-soft)">${svg('<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>', '#E04F4F')}</div>
        <h1 style="font-size:1.8rem">Excluir remédio?</h1>
        <p class="sub">Você perde os lembretes<br>de ${esc(m.name)}.</p></div>
        <div class="actions"><button class="btn-danger" id="yes">Sim, excluir</button>
        <button class="btn-primary" data-go="meds">Manter remédio</button></div></section>`,
      bind(r) { $('#yes', r).onclick = () => { Meds.remove(id); go('meds'); }; }
    };
  }
};
