# 🐉 Dragon Ball: Zenkai Fighters

Jogo de **luta 2D em pixel art** (estilo *Mortal Kombat* com tema Dragon Ball), desenvolvido com **HTML, CSS e JavaScript puros** — sem bibliotecas nem imagens externas (tudo desenhado em código na tela).

## 🕹️ Como jogar

| Ação | Jogador 1 | Jogador 2 / CPU |
|---|---|---|
| Mover / pular / agachar | ← ↑ ↓ → | W A S D |
| Soco (combo: 2 socos) | Z | J |
| Chute (finalizador na sequência) | X | K |
| Ki — toque rápido: projétil | C | L |
| Ki — **segurar e soltar**: feixe (Kamehameha) | C | L |
| **SUPER** (com KI em 100%) | V | U |
| Defender (segurar trás) | ← | A |

**Regras:** melhor de 3 rounds, 99 segundos por round.
Acerte golpes para carregar o **KI** — no máximo, solte o golpe especial do personagem.

## 🎯 Personagens (4 heróis + 5 vilões)

| Lado | Personagens |
|---|---|
| Heróis | Goku, Vegeta, Gohan, Piccolo |
| Vilões | Broly, Jiren, Bills, Cell, Freeza |

Cada um tem: 3 golpes com nome do anime (**projétil, feixe e SUPER**), stat próprio de vida/velocidade/poder e sprites próprios em pixel art.

## 🌸 Cenários (referências a outros animes)

1. **Vila da Folha** — referência a *Naruto* (montanha dos Hokages)
2. **Cidade de Karakura** — referência a *Bleach* (noite, cerejeira, lua)
3. **Japão Taisho** — referência a *Demon Slayer* (lanternas à noite)

## 📁 Estrutura do código

```
dragon-ball-game/
├── index.html      # Telas: login, menu, seleção, cenário, HUD e resultado
├── css/style.css   # Visual (login reaproveitado + interface da luta)
└── js/
    ├── data.js     # Dados: 9 personagens, golpes e 3 cenários
    ├── art.js      # Pixel art: cenários, lutadores, retratos e efeitos
    └── game.js     # Motor: telas, física, combos, KI, IA, rounds e HUD
```

- **Tela de login** reaproveitada do projeto anterior (sem o medidor de nível de poder).
- **IA do computador** com estados: avança, recua, defende, pula, ataca e usa especial.
- Recorde de nome salvo no `localStorage`.

## 🚀 Rodando localmente

Abra o `index.html` no navegador, ou use um servidor local:

```bash
npx serve .
```

## 🌐 Online

Jogo: https://pimenteladryan-blip.github.io/dragon-ball-game/
