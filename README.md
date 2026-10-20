# 🐉 Dragon Ball: Batalha de Ki

Jogo web de ação (estilo *shoot 'em up* aéreo) desenvolvido com **HTML, CSS e JavaScript puros**, para a atividade avaliativa de Desenvolvimento de Jogo com IA.

## 🎮 Como jogar

- **Mover:** setas ou **WASD** (no celular: arraste o dedo na tela ou use o D-pad)
- **Atacar:** barra de **ESPAÇO**, clique/tap na tela ou botão **●**
- **Rajada especial (Kamehameha):** **SHIFT** ou botão **⚡** — gasta 50 de Ki e acerta todos os inimigos
- **Pausar:** **P** ou **ESC**

## 🎯 Objetivo

- Sobreviver a **5 ondas** de inimigos (Saibamens e soldados da Força Freeza)
- Derrotar o **chefão final: CELL** na onda 5 → **VITÓRIA**
- Se a barra de **VIDA** chegar a 0 → **DERROTA**

## ⭐ Recursos

- Interface visual com HUD: pontos, onda, recorde, barras de VIDA e KI
- Recorde salvo automaticamente (localStorage)
- Itens: **Feijão Senzu** (cura) e **Esferas do Dragão** (recarrega Ki + pontos)
- Efeitos: partículas, screen shake, aura, trilha de estrelas e barra de vida do chefe
- Controles de teclado, mouse e **toque** (mobile)
- Responsivo

## 📁 Estrutura

```
dragon-ball-game/
├── index.html      # Estrutura e telas (menu, pausa, fim de jogo)
├── css/style.css   # Estilo visual (tema Dragon Ball)
└── js/game.js      # Regras, loop, colisões, IA e renderização
```

## 🕹️ Rodando localmente

Abra o `index.html` no navegador, ou use um servidor local:

```bash
npx serve .
```
