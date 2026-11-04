# Remédio na Hora

Aplicativo web (HTML + CSS + JavaScript puro) baseado no protótipo de IHC.

## Como executar
Abra `index.html` no navegador (duplo clique). Não precisa instalar nada.
Opcional: `python3 -m http.server 8000` e acesse http://localhost:8000

## Estrutura
```
remedio-na-hora/
├── index.html        # página única
├── css/styles.css    # estilos (cores e componentes do protótipo)
└── js/
    ├── storage.js    # localStorage: usuários, remédios, doses
    ├── alarm.js      # verificação de horários, som e notificação
    ├── screens.js         # login, cadastro, alarme, confirmação
    ├── screens-agenda.js  # Hoje, Novo remédio, Calendário, Meus remédios
    └── app.js        # navegação e inicialização
```

## Telas / funcionalidades
1. Início (Entrar / Cadastrar) + telas de login e cadastro com validação
2. Hoje: doses do dia, contador "X de N doses tomadas", estados Tomado / Próximo / Atrasado / Pendente
3. Novo remédio: nome, dose, vários horários (adicionar/remover), validação
4. Remédio salvo: mostra o próximo lembrete
5. Hora do remédio: "Tomei" ou "Adiar 10 min" (dispara sozinho no horário; toque numa dose para simular)
6. Meus remédios + confirmação de exclusão

Dados ficam no navegador (localStorage). Senhas só codificadas: uso acadêmico.

## Agenda (v2)
- Horários fixos **ou** de X em X horas (4, 6, 8, 12 h) a partir da primeira dose
- Dias da semana (Dom–Sáb) e período opcional com início e fim
- Calendário mensal com histórico: verde = tudo tomado, vermelho = esquecido, azul = a tomar
