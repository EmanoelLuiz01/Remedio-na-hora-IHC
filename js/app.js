/* Roteador simples + inicialização */
function go(name, param) {
  const pub = ['welcome', 'login', 'register'];
  if (!Auth.current() && !pub.includes(name)) name = 'welcome';
  if (Auth.current() && pub.includes(name)) name = 'home';
  const app = document.getElementById('app');
  const s = Screens[name](param);
  app.innerHTML = s.html;
  app.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
  if (s.bind) s.bind(app);
  window.scrollTo(0, 0);
}
Alarm.start(dose => go('alarm', dose.id));
go('home');
