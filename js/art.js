/* =========================================================
   ARTE PIXEL — cenários, lutadores e retratos
   Desenhado com retângulos/polinhas em baixa resolução
   (o CSS amplia com image-rendering: pixelated = visual 8 bits)
   ========================================================= */

function px(c, x, y, w, h, cor) {
  c.fillStyle = cor;
  c.fillRect(Math.round(x), Math.round(y), w, h);
}

/* Membro = polilinha grossa (braços e pernas) */
function membro(c, pts, larg, cor) {
  c.strokeStyle = cor;
  c.lineWidth = larg;
  c.lineCap = "square";
  c.lineJoin = "miter";
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
  c.stroke();
}

/* ---------------------------------------------------------
   CABEÇA + CABELO (usado no lutador e no retrato)
--------------------------------------------------------- */
function desenharCabeca(c, p, cx, cy, olhosGrandes) {
  const co = p.cores;
  // rosto
  px(c, cx - 7, cy - 7, 14, 14, co.pele);
  px(c, cx - 6, cy + 5, 12, 3, co.pele); // queixo

  // olhos
  if (olhosGrandes) {
    px(c, cx - 5, cy - 3, 4, 4, "#14141c");
    px(c, cx + 1, cy - 3, 4, 4, "#14141c");
  } else {
    px(c, cx - 5, cy - 2, 3, 3, "#14141c");
    px(c, cx + 2, cy - 2, 3, 3, "#14141c");
  }

  const cabelo = p.cabelo;
  const h = co.cabelo;

  if (cabelo === "espetado" || cabelo === "franja") {
    // picos pra cima (Goku / Gohan)
    px(c, cx - 8, cy - 10, 16, 4, h);
    const picos = [[-8, -6, 4, 8], [-3, -6, 4, 12], [2, -6, 4, 9], [6, -6, 3, 6]];
    picos.forEach(([ox, oy, w, alt]) => px(c, cx + ox, cy + oy - alt, w, alt, h));
    if (cabelo === "franja") px(c, cx - 7, cy - 5, 6, 4, h); // franja
  } else if (cabelo === "vertical") {
    // Vegeta: picos verticais altos
    px(c, cx - 8, cy - 11, 16, 4, h);
    px(c, cx - 7, cy - 20, 5, 10, h);
    px(c, cx - 1, cy - 23, 5, 13, h);
    px(c, cx + 4, cy - 20, 5, 10, h);
  } else if (cabelo === "longo") {
    // Broly: cabelo enorme até os ombros
    px(c, cx - 10, cy - 12, 20, 6, h);
    px(c, cx - 11, cy - 6, 6, 22, h);
    px(c, cx + 5, cy - 6, 6, 22, h);
    px(c, cx - 8, cy - 16, 16, 6, h);
  } else if (cabelo === "namekiano") {
    // Piccolo: antenas + orelhas pontudas
    px(c, cx - 6, cy - 9, 3, 6, co.pele);
    px(c, cx + 3, cy - 9, 3, 6, co.pele);
    px(c, cx - 11, cy - 3, 4, 5, co.pele);
    px(c, cx + 7, cy - 3, 4, 5, co.pele);
    // manchas na cabeça
    px(c, cx - 4, cy - 6, 3, 3, "#2f8a2f");
    px(c, cx + 2, cy - 6, 3, 3, "#2f8a2f");
  } else if (cabelo === "careca") {
    // Jiren: cabeça lisa + orelhas
    px(c, cx - 9, cy - 2, 3, 4, co.pele);
    px(c, cx + 6, cy - 2, 3, 4, co.pele);
    px(c, cx - 4, cy + 3, 8, 2, "#7a7f8c");
  } else if (cabelo === "deus") {
    // Bills: orelhas de gato grandes
    px(c, cx - 8, cy - 16, 5, 12, co.pele);
    px(c, cx + 3, cy - 16, 5, 12, co.pele);
    px(c, cx - 7, cy - 14, 3, 7, "#e08fb0");
    px(c, cx + 4, cy - 14, 3, 7, "#e08fb0");
    px(c, cx - 7, cy - 9, 14, 4, co.pele);
    px(c, cx - 2, cy + 2, 4, 3, "#e0b040"); // marca dourada
  } else if (cabelo === "coroa") {
    // Cell: cristas laterais pontudas
    px(c, cx - 8, cy - 9, 16, 3, h);
    px(c, cx - 10, cy - 20, 5, 12, h);
    px(c, cx + 5, cy - 20, 5, 12, h);
    px(c, cx - 3, cy - 24, 6, 15, h);
    px(c, cx - 6, cy - 5, 12, 4, "#d9d2ff"); // rosto claro
  } else if (cabelo === "domo") {
    // Freeza: cúpula roxa
    px(c, cx - 7, cy - 11, 14, 6, h);
    px(c, cx - 5, cy - 13, 10, 3, h);
    px(c, cx - 7, cy - 6, 4, 4, h);
    px(c, cx + 3, cy - 6, 4, 4, h);
  }
}

/* ---------------------------------------------------------
   LUTADOR
--------------------------------------------------------- */
function desenharLutador(c, L, t) {
  const p = L.personagem;
  const co = p.cores;
  const e = L.estado;

  // leque de poses: bob = respiração, agachado, etc.
  const agachado = e === "agachar";
  const bob = e === "parado" ? Math.round(Math.sin(t * 5) * 1) : 0;
  const andando = e === "andar";

  // alturas do corpo
  let quadrilY = (agachado ? -16 : -24) + bob;
  let ombroY = (agachado ? -30 : -42) + bob;
  let cabY = (agachado ? -41 : -54) + bob;
  let inclina = 0; // inclinação do tronco

  // progresso do ataque (0 → 1)
  const pr = L.ataque ? Math.min(1, L.tAtq / (L.ataque.dur * 0.5)) : 0;

  // pernas (posição dos pés)
  let peFrente = [7, 0], peTras = [-7, 0];
  if (andando) {
    const balanco = Math.sin(t * 12) * 6;
    peFrente = [7 + balanco, 0];
    peTras = [-7 - balanco, 0];
  }
  if (e === "pular") { peFrente = [8, -14]; peTras = [-6, -10]; }
  if (agachado) { peFrente = [9, 0]; peTras = [-9, 0]; }
  if (e === "caido") { peFrente = [16, -4]; peTras = [12, -2]; }
  if (e === "chute" || e === "chute3") {
    const ext = Math.sin(pr * Math.PI);
    peFrente = [10 + 24 * ext, -22 * ext];
    peTras = [-8, 0];
  }

  // braços (mãos)
  let maoFrente = [12, ombroY + 12];
  let maoTras = [-12, ombroY + 12];
  if (andando) {
    const b = Math.sin(t * 12) * 5;
    maoFrente = [12 + b, ombroY + 13];
    maoTras = [-12 - b, ombroY + 13];
  }
  if (e === "soco1" || e === "soco2") {
    const ext = Math.sin(pr * Math.PI);
    maoFrente = [14 + 20 * ext, ombroY + 4];
    maoTras = [-13, ombroY + 8];
    inclina = 3 * ext;
  }
  if (e === "chute3") { maoFrente = [16, ombroY - 6]; maoTras = [-16, ombroY - 4]; }
  if (e === "projetil") { maoFrente = [20, ombroY + 2]; maoTras = [-8, ombroY + 6]; }
  if (e === "feixe" || e === "super") { maoFrente = [22, ombroY + 3]; maoTras = [20, ombroY + 9]; }
  if (e === "dano") { maoFrente = [10, ombroY - 8]; maoTras = [-14, ombroY - 6]; inclina = -6; }
  if (e === "bloqueio") { maoFrente = [11, ombroY + 2]; maoTras = [9, ombroY + 10]; inclina = -3; }
  if (e === "caido") { maoFrente = [14, -8]; maoTras = [-6, -6]; }
  if (e === "vitoria") { maoFrente = [10, ombroY - 26]; maoTras = [-12, ombroY + 10]; }

  c.save();
  c.translate(Math.round(L.x), Math.round(L.y));
  if (L.virado < 0) c.scale(-1, 1);
  if (e === "caido") c.rotate(-1.25); // cai de costas

  // aura (carregando ki ou super)
  if (L.aura > 0 || e === "super") {
    const r = 26 + Math.sin(t * 18) * 5 + (e === "super" ? 14 : 0);
    const g = c.createRadialGradient(0, -30, 4, 0, -30, r);
    g.addColorStop(0, "rgba(255,255,255,.75)");
    g.addColorStop(0.5, (L.corKi || "#ffd21e") + "aa");
    g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g;
    c.beginPath();
    c.arc(0, -30, r, 0, Math.PI * 2);
    c.fill();
  }

  const qx = inclina * 0.4;
  const ox = inclina * 0.8;

  // braço de trás
  membro(c, [[ox, ombroY], [maoTras[0] * 0.5, ombroY + 7], maoTras], 5, escurecer(co.pele, -18));
  // perna de trás
  membro(c, [[qx, quadrilY], [peTras[0] * 0.5, (quadrilY) / 2], peTras], 7, escurecer(co.roupa, -30));

  // tronco
  membro(c, [[qx, quadrilY], [ox, ombroY]], 15, co.roupa);
  // detalhe da roupa (peitoral/faixa)
  if (co.detalhe) px(c, ox - 7, ombroY + 4, 14, 4, co.detalhe);
  px(c, qx - 7, quadrilY - 3, 14, 5, co.extra || co.detalhe); // cinto

  // perna da frente
  membro(c, [[qx, quadrilY], [peFrente[0] * 0.5, quadrilY / 2], peFrente], 7, co.roupa);

  // cabeça
  desenharCabeca(c, p, ox + 1, cabY, p.cabelo === "careca");

  // braço da frente
  membro(c, [[ox, ombroY], [maoFrente[0] * 0.55, ombroY + 6], maoFrente], 5, co.pele);
  // mão
  px(c, maoFrente[0] - 3, maoFrente[1] - 3, 6, 6, co.pele);

  c.restore();
}

/* Escurece/clarifica uma cor hex */
function escurecer(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `rgb(${r},${g},${b})`;
}

/* ---------------------------------------------------------
   PROJÉTEIS (ki, feixe e super)
--------------------------------------------------------- */
function desenharProjecil(c, s) {
  const cor = s.cor;
  c.save();
  if (s.tipo === "bola") {
    c.shadowColor = cor;
    c.shadowBlur = 8;
    px(c, s.x - s.w / 2, s.y - s.h / 2, s.w, s.h, cor);
    px(c, s.x - s.w / 4, s.y - s.h / 4, s.w / 2, s.h / 2, "#ffffff");
    c.shadowBlur = 0;
  } else {
    // feixe / super: jato horizontal com núcleo branco
    c.shadowColor = cor;
    c.shadowBlur = 12;
    px(c, s.x - s.w / 2, s.y - s.h / 2, s.w, s.h, cor);
    px(c, s.x - s.w / 2, s.y - s.h / 5, s.w, s.h * 0.4, "#ffffff");
    c.shadowBlur = 0;
    // "cabos" de energia atrás
    for (let i = 0; i < 3; i++) {
      const alt = Math.sin(s.t * 20 + i) * 3;
      px(c, s.x - s.w / 2 - 6 - i * 4, s.y - 2 + alt, 5, 3, cor);
    }
  }
  c.restore();
}

/* Partículas simples */
function desenharParticula(c, pa) {
  c.globalAlpha = Math.max(0, pa.life / pa.max);
  px(c, pa.x, pa.y, pa.size, pa.size, pa.cor);
  c.globalAlpha = 1;
}

/* ---------------------------------------------------------
   CENÁRIOS — 3 referências de outros animes
--------------------------------------------------------- */
function desenharCenario(c, id, t, W, H) {
  const chao = H - 34;

  if (id === "konoha") {
    // ---- NARUTO: Vila da Folha ----
    px(c, 0, 0, W, H, "#8ed4f5");
    px(c, 0, 0, W, 40, "#6fc2ee");
    // nuvens
    for (let i = 0; i < 3; i++) {
      const cx = ((t * (6 + i * 3) + i * 150) % (W + 80)) - 40;
      px(c, cx, 26 + i * 18, 52, 10, "#ffffff");
      px(c, cx + 10, 20 + i * 18, 30, 8, "#ffffff");
    }
    // montanha dos Hokages (4 rostos)
    px(c, 40, 44, 300, 60, "#9b7a5a");
    px(c, 60, 36, 260, 16, "#9b7a5a");
    for (let i = 0; i < 4; i++) {
      const fx = 80 + i * 62;
      px(c, fx, 52, 40, 44, "#c9a67a");
      px(c, fx + 7, 62, 7, 5, "#5a4432");   // olho
      px(c, fx + 25, 62, 7, 5, "#5a4432");  // olho
      px(c, fx + 16, 70, 7, 8, "#a8845c");  // nariz
      px(c, fx + 10, 84, 20, 4, "#5a4432"); // boca
      px(c, fx + 4, 50, 32, 6, "#6a5240");  // cabelo
    }
    // casas da vila (telhados)
    px(c, 0, 96, W, 40, "#7ec8a0");
    for (let i = 0; i < 6; i++) {
      const hx = i * 86 - 20;
      px(c, hx, 112, 70, 30, "#e8d9b8");
      px(c, hx - 6, 104, 82, 12, "#d9541e");
      px(c, hx + 14, 122, 14, 20, "#7a5c3a");
      px(c, hx + 42, 118, 16, 12, "#6fb8e8");
    }
    // árvores
    px(c, 16, 88, 10, 34, "#7a5c3a");
    px(c, 4, 74, 34, 24, "#3fae4a");
    px(c, 430, 90, 10, 32, "#7a5c3a");
    px(c, 418, 76, 34, 24, "#3fae4a");
    // chão
    px(c, 0, chao, W, H - chao, "#d9c08e");
    px(c, 0, chao, W, 4, "#b89a68");
  }

  else if (id === "karakura") {
    // ---- BLEACH: cidade de Karakura à noite ----
    px(c, 0, 0, W, H, "#131a3d");
    px(c, 0, 0, W, 60, "#0c1129");
    // estrelas
    for (let i = 0; i < 24; i++) {
      const sx = (i * 71) % W, sy = (i * 37) % 70;
      const tw = Math.sin(t * 3 + i) > 0 ? "#ffffff" : "#7a86c9";
      px(c, sx, sy, 2, 2, tw);
    }
    // lua cheia
    px(c, 360, 24, 44, 44, "#f5edc0");
    px(c, 356, 20, 52, 52, "#f5edc0");
    px(c, 368, 34, 8, 7, "#e3d79c");
    px(c, 388, 48, 6, 6, "#e3d79c");
    // casas japonesas (telhados escuros, janelas acesas)
    px(c, 0, 118, W, 46, "#1c2140");
    for (let i = 0; i < 5; i++) {
      const hx = i * 104 - 18;
      px(c, hx, 108, 84, 12, "#2b3159");
      px(c, hx + 8, 96, 68, 14, "#2b3159");
      px(c, hx + 14, 124, 24, 26, "#2a2338");
      const acesa = Math.sin(t * 2 + i) > -0.6;
      px(c, hx + 52, 126, 20, 18, acesa ? "#ffb845" : "#3a3550");
    }
    // cerejeira com pétalas caindo
    px(c, 70, 96, 12, 40, "#5a3a2a");
    px(c, 46, 74, 60, 28, "#f7a8c8");
    px(c, 56, 66, 40, 14, "#ffc9de");
    for (let i = 0; i < 10; i++) {
      const py = (t * 26 + i * 34) % (H - 40);
      const pxx = 50 + ((i * 53 + Math.sin(t * 2 + i) * 24) % 140);
      px(c, pxx, py, 3, 3, "#f7a8c8");
    }
    // chão
    px(c, 0, chao, W, H - chao, "#2a2f4d");
    px(c, 0, chao, W, 4, "#3c4270");
    for (let i = 0; i < 8; i++) px(c, i * 64 + 10, chao + 16, 34, 3, "#3c4270");
  }

  else {
    // ---- DEMON SLAYER: Japão Taisho à noite ----
    px(c, 0, 0, W, H, "#171232");
    px(c, 0, 0, W, 70, "#0e0a22");
    // lua
    px(c, 60, 22, 34, 34, "#f2e8c9");
    px(c, 56, 18, 42, 42, "#f2e8c9");
    // montanhas ao fundo
    px(c, 0, 92, 200, 70, "#241c4a");
    px(c, 140, 78, 220, 84, "#1d1740");
    px(c, 300, 88, 180, 74, "#241c4a");
    // rua com casas de madeira
    px(c, 0, 126, W, 44, "#3a2a22");
    for (let i = 0; i < 5; i++) {
      const hx = i * 104 - 12;
      px(c, hx, 118, 88, 14, "#2b1f1a");
      px(c, hx + 6, 132, 76, 38, "#4a342a");
      px(c, hx + 26, 140, 30, 30, "#ffb845"); // porta acesa
      px(c, hx + 30, 144, 6, 22, "#e8901e");
      px(c, hx + 42, 144, 6, 22, "#e8901e");
    }
    // lanternas balançando
    for (let i = 0; i < 4; i++) {
      const lx = 44 + i * 118;
      const balanco = Math.sin(t * 2 + i) * 3;
      px(c, lx + 6 + balanco, 118, 2, 10, "#1a1420");
      const brilho = Math.sin(t * 6 + i) > -0.3 ? "#ff5a3c" : "#d13a24";
      px(c, lx + balanco, 128, 14, 16, brilho);
      px(c, lx + 3 + balanco, 132, 8, 8, "#ffd6a0");
      px(c, lx + balanco, 126, 14, 3, "#1a1420");
      px(c, lx + balanco, 144, 14, 3, "#1a1420");
    }
    // chão de terra
    px(c, 0, chao, W, H - chao, "#4a3a44");
    px(c, 0, chao, W, 4, "#5c4a56");
    for (let i = 0; i < 10; i++) px(c, (i * 53 + 20) % W, chao + 12, 6, 4, "#5c4a56");
  }
}

/* ---------------------------------------------------------
   RETRATO (miniatura na seleção de personagem)
--------------------------------------------------------- */
function desenharRetrato(canvas, p) {
  const c = canvas.getContext("2d");
  const W = (canvas.width = 32), H = (canvas.height = 32);
  // fundo
  const fundo = p.lado === "HERÓI" ? "#123a6b" : "#5a1020";
  px(c, 0, 0, W, H, fundo);
  px(c, 0, 24, W, 8, escurecer(fundo, -18));
  // corpo (ombros)
  px(c, 4, 24, 24, 8, p.cores.roupa);
  px(c, 12, 24, 8, 4, p.cores.pele);
  // cabeça
  desenharCabeca(c, p, 16, 15, p.cabelo === "careca");
}

/* Miniatura de cenário */
function desenharMiniCenario(canvas, id) {
  const c = canvas.getContext("2d");
  canvas.width = 220;
  canvas.height = 124;
  c.imageSmoothingEnabled = false;
  // desenha em escala ~0.46 usando a mesma função
  c.save();
  c.scale(220 / 480, 124 / 270);
  desenharCenario(c, id, 1, 480, 270);
  c.restore();
}
