/* Telas de agenda: Hoje, Novo remédio (2 passos), Salvo, Meus remédios, Calendário */
const LABEL = { taken: 'Tomado', next: 'Próximo', late: 'Atrasado', pending: 'Pendente' };
const BCLS = { taken: 'ok', next: 'next', late: 'late', pending: '' };
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const doseRow = (d, click) => `<${click ? 'button data-dose="' + d.id + '"' + (d.taken ? ' disabled' : '') : 'div'} class="card ${d.state === 'next' ? 'next' : ''}">
  <span class="t">${d.time}</span><span class="n">${esc(d.med.name)}</span><span class="badge ${BCLS[d.state]}">${LABEL[d.state]}</span></${click ? 'button' : 'div'}>`;

Object.assign(Screens, {
  home: () => {
    const list = Doses.today(), taken = list.filter(d => d.taken).length;
    return {
      html: `<section class="screen"><div class="top"><button class="link" data-go="meds">Meus remédios</button>
        <button class="link" data-go="calendar">Calendário</button><button class="link" id="out">Sair</button></div>
        <h2 style="margin-bottom:6px">Hoje</h2>
        <p class="sub" style="text-align:center;margin-bottom:20px">${taken} de ${list.length} doses tomadas</p>
        ${list.length ? `<div class="list">${list.map(d => doseRow(d, true)).join('')}</div>
          <p class="sub" style="font-size:.85rem;text-align:center;margin-top:14px">Toque em uma dose para registrar.</p>`
          : `<p class="empty">Nenhuma dose para hoje.<br>Toque em “Novo remédio” para começar.</p>`}
        <div class="actions"><button class="btn-outline" data-go="new">Novo remédio</button></div></section>`,
      bind(r) {
        $('#out', r).onclick = () => { Auth.logout(); go('welcome'); };
        r.querySelectorAll('[data-dose]').forEach(b => b.onclick = () => go('alarm', b.dataset.dose));
      }
    };
  },

  new: () => {
    const st = { step: 1, name: '', dose: '', mode: 'fixed', times: [], first: '08:00', every: 6,
      days: [0, 1, 2, 3, 4, 5, 6], range: false, start: todayKey(), end: '', err: '' };
    const gen = () => { const [h, m] = st.first.split(':').map(Number);
      return [...Array(Math.floor(24 / st.every))].map((_, k) => `${pad((h + k * st.every) % 24)}:${pad(m)}`).sort(); };
    const WD = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    const seg = (attr, opts) => `<div class="seg">${opts.map(([v, t, on]) => `<button class="${on ? 'on' : ''}" ${attr}="${v}">${t}</button>`).join('')}</div>`;
    return {
      html: '<section class="screen" id="w"></section>',
      bind(r) {
        const w = $('#w', r);
        const step1 = () => `<div><button class="back" id="b1" aria-label="Voltar">‹</button></div><h2>Novo remédio</h2>
          <label for="name">Nome do remédio</label><input id="name" placeholder="Ex.: Vitamina C" value="${esc(st.name)}">
          <label for="dose">Dose</label><input id="dose" placeholder="Ex.: 1 comprimido" value="${esc(st.dose)}">
          <p class="error" role="alert">${st.err}</p><div class="actions"><button class="btn-primary" id="next">Continuar</button></div>`;
        const step2 = () => `<div><button class="back" id="b2" aria-label="Voltar">‹</button></div><h2>Quando tomar?</h2>
          <label>Horários</label>${seg('data-mode', [['fixed', 'Horários fixos', st.mode === 'fixed'], ['interval', 'De X em X horas', st.mode === 'interval']])}
          ${st.mode === 'fixed' ? `<div class="chips" id="chips">${st.times.map(t => `<button class="chip" data-t="${t}" aria-label="Remover ${t}">${t}</button>`).join('')}</div>
            <div class="time-add"><input id="time" type="time" aria-label="Novo horário"><button class="btn-outline" id="add">Adicionar</button></div>
            <p class="sub" style="font-size:.85rem;margin-top:8px">Toque em um horário para removê-lo.</p>`
          : `<div class="row"><input id="first" type="time" value="${st.first}" aria-label="Primeira dose">
            <select id="every" aria-label="Intervalo">${[4, 6, 8, 12].map(n => `<option value="${n}" ${n === st.every ? 'selected' : ''}>a cada ${n} h</option>`).join('')}</select></div>
            <div class="chips" style="margin-top:12px">${gen().map(t => `<span class="chip">${t}</span>`).join('')}</div>`}
          <label>Dias da semana</label><div class="wd">${WD.map((d, i) => `<button class="${st.days.includes(i) ? 'on' : ''}" data-wd="${i}" aria-label="${DIAS[i]}">${d}</button>`).join('')}</div>
          <label>Período</label>${seg('data-range', [['0', 'Sem data final', !st.range], ['1', 'Por período', st.range]])}
          ${st.range ? `<div class="row"><input id="start" type="date" value="${st.start}" aria-label="Início"><input id="end" type="date" value="${st.end}" aria-label="Fim"></div>` : ''}
          <p class="error" role="alert">${st.err}</p><div class="actions"><button class="btn-primary" id="save">Salvar remédio</button></div>`;
        const draw = () => { w.innerHTML = st.step === 1 ? step1() : step2(); wire(); };
        const fail = m => { st.err = m; draw(); };
        const wire = () => {
          const on = (sel, ev, fn) => w.querySelectorAll(sel).forEach(e => e['on' + ev] = () => fn(e));
          on('#b1', 'click', () => go('home'));
          on('#name', 'input', e => st.name = e.value); on('#dose', 'input', e => st.dose = e.value);
          on('#next', 'click', () => { st.name = st.name.trim(); st.dose = st.dose.trim();
            if (!st.name || !st.dose) return fail('Preencha o nome e a dose do remédio.'); st.err = ''; st.step = 2; draw(); });
          on('#b2', 'click', () => { st.step = 1; st.err = ''; draw(); });
          on('[data-mode]', 'click', e => { st.mode = e.dataset.mode; st.err = ''; draw(); });
          on('#add', 'click', () => { const v = $('#time', w).value;
            if (!v) return fail('Escolha um horário antes de adicionar.');
            if (st.times.includes(v)) return fail('Esse horário já foi adicionado.');
            st.times.push(v); st.times.sort(); st.err = ''; draw(); });
          on('[data-t]', 'click', e => { st.times.splice(st.times.indexOf(e.dataset.t), 1); draw(); });
          on('#first', 'change', e => { st.first = e.value || '08:00'; draw(); });
          on('#every', 'change', e => { st.every = +e.value; draw(); });
          on('[data-wd]', 'click', e => { const i = +e.dataset.wd;
            st.days = st.days.includes(i) ? st.days.filter(x => x !== i) : [...st.days, i]; draw(); });
          on('[data-range]', 'click', e => { st.range = e.dataset.range === '1'; draw(); });
          on('#start', 'input', e => st.start = e.value); on('#end', 'input', e => st.end = e.value);
          on('#save', 'click', () => {
            const times = st.mode === 'fixed' ? st.times : gen();
            if (!times.length) return fail('Adicione pelo menos um horário.');
            if (!st.days.length) return fail('Escolha pelo menos um dia da semana.');
            if (st.range && (!st.start || !st.end || st.end < st.start)) return fail('Escolha o início e um fim que não seja antes do início.');
            const m = Meds.add({ name: st.name, dose: st.dose, mode: st.mode, every: st.mode === 'interval' ? st.every : null,
              times, days: [...st.days].sort(), start: st.range ? st.start : todayKey(), end: st.range ? st.end : null });
            go('saved', m.id);
          });
        };
        draw();
      }
    };
  },

  saved: id => {
    const m = Meds.find(id), n = Doses.nextDose(m);
    const quando = !n ? 'nenhuma dose nos próximos dias' : n.i === 0 ? 'hoje' : n.i === 1 ? 'amanhã' : `${DIAS[new Date(n.date + 'T12:00').getDay()]}, ${fmt(n.date)}`;
    return {
      html: `<section class="screen"><div class="center">
        <div class="icon-circle" style="background:var(--green)">${svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>', '#fff')}</div>
        <h1 style="font-size:1.8rem">Remédio salvo!</h1><p class="sub">${esc(m.name)} · ${esc(m.dose)}</p>
        <p class="sub" style="font-size:.95rem">${Meds.describe(m)}</p>
        <p class="sub" style="margin-top:14px">Próximo lembrete (${quando}):</p><div class="big">${n ? n.time : '—'}</div>
        <p class="sub" style="margin-top:14px">Você será avisado<br>pelo aplicativo.</p></div>
        <div class="actions"><button class="btn-primary" data-go="home">Ver meus remédios</button></div></section>`
    };
  },

  meds: () => {
    const ms = Meds.all();
    return {
      html: `<section class="screen"><div><button class="back" data-go="home" aria-label="Voltar">‹</button></div>
        <h2>Meus remédios</h2>
        ${ms.length ? `<div class="list">${ms.map(m => `<div class="card med"><span class="n"><strong>${esc(m.name)}</strong> · ${esc(m.dose)}<br>
          <span class="sub" style="font-size:.9rem">${m.times.join(', ')}<br>${Meds.describe(m)}</span></span>
          <button class="del" data-del="${m.id}">Excluir</button></div>`).join('')}</div>`
          : '<p class="empty">Nenhum remédio cadastrado.</p>'}
        <div class="actions"><button class="btn-outline" data-go="new">Novo remédio</button></div></section>`,
      bind(r) { r.querySelectorAll('[data-del]').forEach(b => b.onclick = () => go('confirm', b.dataset.del)); }
    };
  },

  calendar: (p = {}) => {
    const now = new Date(), y = p.y ?? now.getFullYear(), m = p.m ?? now.getMonth(), sel = p.sel || todayKey();
    let cells = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => `<span class="h">${d}</span>`).join('');
    cells += '<span></span>'.repeat(new Date(y, m, 1).getDay());
    for (let d = 1; d <= new Date(y, m + 1, 0).getDate(); d++) {
      const k = dateKey(new Date(y, m, d)), l = Doses.forDate(k);
      const c = !l.length ? '' : l.some(x => x.state === 'late') ? 'late' : l.every(x => x.taken) ? 'ok' : 'pend';
      cells += `<button class="day ${k === sel ? 'sel' : ''}" data-d="${k}" aria-label="Dia ${d}">${d}<i class="dot ${c}"></i></button>`;
    }
    const doses = Doses.forDate(sel);
    return {
      html: `<section class="screen"><div><button class="back" data-go="home" aria-label="Voltar">‹</button></div>
        <h2 style="margin-bottom:12px">Calendário</h2>
        <div class="mnav"><button data-nav="-1" aria-label="Mês anterior">‹</button><strong>${MESES[m]} ${y}</strong><button data-nav="1" aria-label="Próximo mês">›</button></div>
        <div class="cal">${cells}</div>
        <div class="legend"><span><i style="background:var(--green)"></i>Tudo tomado</span><span><i style="background:var(--red)"></i>Esquecido</span><span><i style="background:var(--blue)"></i>A tomar</span></div>
        <p class="sub" style="font-weight:600;margin-bottom:8px">${fmt(sel)}</p>
        ${doses.length ? `<div class="list">${doses.map(d => doseRow(d, false)).join('')}</div>` : '<p class="sub">Nenhuma dose neste dia.</p>'}</section>`,
      bind(r) {
        r.querySelectorAll('[data-d]').forEach(b => b.onclick = () => go('calendar', { y, m, sel: b.dataset.d }));
        r.querySelectorAll('[data-nav]').forEach(b => b.onclick = () => { const n = new Date(y, m + +b.dataset.nav, 1);
          go('calendar', { y: n.getFullYear(), m: n.getMonth(), sel }); });
      }
    };
  }
});
