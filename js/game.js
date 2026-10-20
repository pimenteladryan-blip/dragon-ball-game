/* =========================================================
   DRAGON BALL: ZENKAI FIGHTERS — motor do jogo
   Telas, luta 1v1, combos, KI, super, IA e rounds
   ========================================================= */

(() => {
  "use strict";

  /* ---------------------------------------------------------
     1. REFERÊNCIAS DA INTERFACE
  --------------------------------------------------------- */
  const $ = (id) => document.getElementById(id);
  const telas = {
    login: $("telaLogin"), menu: $("telaMenu"), select: $("telaSelect"),
    cenario: $("telaCenario"), resultado: $("telaResultado"),
  };
  const hud = $("hud");
  const avisoEl = $("aviso");
  const canvas = $("arena");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const CHAO = H - 34;
  ctx.imageSmoothingEnabled = false;

  const estado = {
    tela: "login",
    jogador: "",
    modo: 1,            // 1 = vs CPU, 2 = 2 jogadores
    escolha: [null, null],
    rodando: 0,         // 0 = P1 escolhe, 1 = P2 escolhe
    cenario: CENARIOS[0],
    shake: 0,
    flash: 0,
  };

  /* ---------------------------------------------------------
     2. ENTRADA (TECLADO)
  --------------------------------------------------------- */
  const teclas = Object.create(null);
  const bordas = new Set();

  window.addEventListener("keydown", (e) => {
    if (!teclas[e.code]) bordas.add(e.code);
    teclas[e.code] = true;
    // evita que a página role com as setas/espaço
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
  });
  window.addEventListener("keyup", (e) => { teclas[e.code] = false; });

  const MAPAS = [
    { esq: "ArrowLeft", dir: "ArrowRight", cima: "ArrowUp", baixo: "ArrowDown",
      soco: "KeyZ", chute: "KeyX", ki: "KeyC", sup: "KeyV" },
    { esq: "KeyA", dir: "KeyD", cima: "KeyW", baixo: "KeyS",
      soco: "KeyJ", chute: "KeyK", ki: "KeyL", sup: "KeyU" },
  ];

  function lerEntrada(idx) {
    const m = MAPAS[idx];
    return {
      esq: !!teclas[m.esq], dir: !!teclas[m.dir], cima: !!teclas[m.cima], baixo: !!teclas[m.baixo],
      soco: bordas.has(m.soco), chute: bordas.has(m.chute), sup: bordas.has(m.sup),
      ki: !!teclas[m.ki], kiSoltou: !teclas[m.ki],
    };
  }

  /* ---------------------------------------------------------
     3. ATAQUES
  --------------------------------------------------------- */
  const ATAQUES = {
    soco1:   { dur: 0.26, hitIni: 0.08, hitFim: 0.17, dano: 6,  alcance: 40, knock: 70 },
    soco2:   { dur: 0.28, hitIni: 0.09, hitFim: 0.19, dano: 6,  alcance: 42, knock: 70 },
    chute:   { dur: 0.44, hitIni: 0.16, hitFim: 0.30, dano: 10, alcance: 52, knock: 140 },
    chute3:  { dur: 0.52, hitIni: 0.14, hitFim: 0.34, dano: 14, alcance: 54, knock: 200 },
    projetil:{ dur: 0.42, spawn: 0.20, custo: 15 },
    feixe:   { dur: 0.75, spawn: 0.38, custo: 35 },
    super:   { dur: 1.45, spawn: 0.75, custo: 100 },
  };

  const GRAV = 760, VEL_PULO = 265;

  /* ---------------------------------------------------------
     4. CRIAÇÃO DE LUTADOR
  --------------------------------------------------------- */
  function novoLutador(personagem, x, virado) {
    return {
      personagem, x, y: CHAO, vx: 0, vy: 0,
      hp: personagem.hp, hpMax: personagem.hp, ki: 0,
      virado, estado: "parado", t: 0, tAtq: 0,
      ataque: null, proximo: null, hitFeito: false, spawnFeito: false,
      noChao: true, segurandoKi: 0, aura: 0, corKi: personagem.coresKi.projetil,
      wins: 0, combo: 0, comboT: 0, esperaDano: 0,
    };
  }

  /* ---------------------------------------------------------
     5. ESTADO DA LUTA
  --------------------------------------------------------- */
  let luta = null;
  let projeteis = [];
  let particulas = [];
  let L1 = null, L2 = null;

  function novaLuta() {
    L1 = novoLutador(estado.escolha[0], 150, 1);
    L2 = novoLutador(estado.escolha[1], W - 150, -1);
    projeteis = [];
    particulas = [];
    luta = { round: 1, tempo: 99, fase: "intro", faseT: 0.2, comboMsg: 0 };
    hud.classList.remove("oculto");
    telas.resultado.classList.add("oculta");
    $("nome1").textContent = estado.modo === 1 ? estado.jogador.toUpperCase() : "JOGADOR 1";
    $("nome2").textContent = estado.modo === 1 ? "COMPUTADOR" : "JOGADOR 2";
    iniciarRound(1);
  }

  function iniciarRound(n) {
    luta.round = n;
    luta.tempo = 99;
    luta.fase = "intro";
    luta.faseT = 1.0;
    [L1, L2].forEach((L, i) => {
      L.hp = L.hpMax;
      L.ki = 0;
      L.x = i === 0 ? 150 : W - 150;
      L.y = CHAO;
      L.vx = 0; L.vy = 0;
      L.estado = "parado";
      L.ataque = null; L.proximo = null; L.t = 0; L.tAtq = 0;
      L.noChao = true; L.esperaDano = 0;
      L.combo = 0;
    });
    projeteis = [];
    mostrarAviso(`ROUND ${n}`);
    atualizarHud();
  }

  /* ---------------------------------------------------------
     6. AVISOS NA TELA (ROUND / LUTEM / K.O.)
  --------------------------------------------------------- */
  let avisoTimer = null;
  function mostrarAviso(txt, vermelho) {
    avisoEl.textContent = txt;
    avisoEl.classList.toggle("vermelho", !!vermelho);
    avisoEl.classList.remove("oculto");
    // reinicia a animação CSS
    avisoEl.style.animation = "none";
    void avisoEl.offsetWidth;
    avisoEl.style.animation = "";
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(() => avisoEl.classList.add("oculto"), 1000);
  }

  function mostrarCombo(n, x, y) {
    const el = document.createElement("div");
    el.className = "combo";
    el.style.left = (x / W) * 100 + "%";
    el.style.top = (y / H) * 100 + "%";
    el.textContent = `${n} HITS!`;
    canvas.parentElement.appendChild(el);
    setTimeout(() => el.remove(), 850);
  }

  /* ---------------------------------------------------------
     7. DANO E COLISÕES
  --------------------------------------------------------- */
  function caixaDo(L) {
    const agachado = L.estado === "agachar";
    const alt = agachado ? 34 : 54;
    return { x1: L.x - 13, x2: L.x + 13, y1: L.y - alt, y2: L.y };
  }

  function aplicarDano(alvo, dano, knock, dir, cor, comboDono) {
    const defendendo = alvo.estado === "bloqueio";
    const real = defendendo ? dano * 0.2 : dano;
    alvo.hp = Math.max(0, alvo.hp - real);
    alvo.ki = Math.min(100, alvo.ki + (defendendo ? 4 : 10));
    alvo.segurandoKi = 0; // perde o feixe que estava carregando

    if (!defendendo) {
      alvo.estado = "dano";
      alvo.t = 0;
      alvo.ataque = null;
      alvo.vx = dir * knock;
      if (knock >= 160 && alvo.noChao) { alvo.vy = -90; alvo.noChao = false; }
    } else {
      alvo.vx = dir * knock * 0.3;
    }

    // partículas de impacto
    for (let i = 0; i < 8; i++) {
      particulas.push({
        x: alvo.x + (Math.random() - 0.5) * 14, y: alvo.y - 34 + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 160, vy: (Math.random() - 0.5) * 160,
        life: 0.35, max: 0.35, size: 2 + (Math.random() * 3 | 0), cor: cor || "#ffd21e",
      });
    }

    estado.shake = Math.max(estado.shake, defendendo ? 0.08 : 0.16);

    // contador de combo do atacante
    if (comboDono) {
      comboDono.combo++;
      comboDono.comboT = 1.2;
      if (comboDono.combo >= 2 && !defendendo) mostrarCombo(comboDono.combo, alvo.x, alvo.y - 70);
    }

    // KI de quem acertou
    if (comboDono) comboDono.ki = Math.min(100, comboDono.ki + 8);

    atualizarHud();

    if (alvo.hp <= 0) terminarRound(alvo === L1 ? L2 : L1);
  }

  /* ---------------------------------------------------------
     8. IA DO COMPUTADOR
  --------------------------------------------------------- */
  const ia = { espera: 0, plano: "andar", tempo: 0 };

  function entradaIA(dt) {
    const eu = L2, ele = L1;
    const dist = Math.abs(eu.x - ele.x);
    const entrada = { esq: false, dir: false, cima: false, baixo: false,
                      soco: false, chute: false, sup: false, ki: false, kiSoltou: true };

    ia.espera -= dt;
    ia.tempo += dt;

    if (ia.espera <= 0) {
      ia.espera = 0.18 + Math.random() * 0.25;
      const r = Math.random();

      if (eu.ki >= 100 && dist < 300 && r < 0.75) {
        ia.plano = "super";
      } else if (dist > 150) {
        ia.plano = r < 0.5 ? "andar" : (r < 0.75 ? "projetil" : "feixe");
      } else if (dist > 55) {
        ia.plano = r < 0.4 ? "andar" : (r < 0.6 ? "pular" : (r < 0.8 ? "feixe" : "projetil"));
      } else {
        ia.plano = r < 0.38 ? "soco" : (r < 0.68 ? "chute" : (r < 0.85 ? "defender" : "recuar"));
      }
    }

    const perto = ele.x < eu.x; // oponente está à direita?

    switch (ia.plano) {
      case "andar":
        if (dist > 58) { perto ? (entrada.dir = true) : (entrada.esq = true); }
        break;
      case "recuar":
        if (dist < 90) { perto ? (entrada.esq = true) : (entrada.dir = true); }
        break;
      case "defender":
        if (ele.ataque && dist < 80) { perto ? (entrada.esq = true) : (entrada.dir = true); }
        else { perto ? (entrada.dir = true) : (entrada.esq = true); }
        break;
      case "pular":
        entrada.cima = true;
        if (dist > 70) { perto ? (entrada.dir = true) : (entrada.esq = true); }
        break;
      case "soco":
        if (dist < 46) entrada.soco = true;
        else { perto ? (entrada.dir = true) : (entrada.esq = true); }
        break;
      case "chute":
        if (dist < 56) entrada.chute = true;
        else { perto ? (entrada.dir = true) : (entrada.esq = true); }
        break;
      case "projetil":
        if (eu.ki >= 15) { entrada.ki = ia.tempo % 1 < 0.05; }
        break;
      case "feixe":
        if (eu.ki >= 35) { entrada.ki = true; ia.tempo = 0; ia.plano = "segurarKi"; }
        break;
      case "segurarKi":
        entrada.ki = ia.tempo < 0.55;   // segura e depois solta
        if (!entrada.ki) ia.plano = "andar";
        break;
      case "super":
        entrada.sup = true;
        ia.plano = "andar";
        break;
    }
    return entrada;
  }

  /* ---------------------------------------------------------
     9. ATUALIZAÇÃO DO LUTADOR
  --------------------------------------------------------- */
  function updLutador(L, inp, op, dt) {
    L.t += dt;
    L.tAtq += dt;
    L.aura = Math.max(0, L.aura - dt * 2);
    L.ki = Math.min(100, L.ki + 1.5 * dt); // KI carrega devagar sozinho
    if (L.comboT > 0) { L.comboT -= dt; if (L.comboT <= 0) L.combo = 0; }

    // ---- estados que travam o controle ----
    if (L.estado === "caido") {
      fisica(L, dt);
      return;
    }
    if (L.estado === "vitoria") { fisica(L, dt); return; }
    if (L.estado === "dano") {
      fisica(L, dt);
      if (L.t > 0.32) mudarEstado(L, "parado");
      return;
    }

    // ---- ataque em andamento ----
    if (L.ataque) {
      const a = L.ataque;
      const fimSpawn = a.spawn != null && !L.spawnFeito && L.tAtq >= a.spawn;

      if (fimSpawn) {
        L.spawnFeito = true;
        atirar(L, a);
      }

      // janela de acerto (golpes corpo a corpo)
      if (a.hitIni != null && !L.hitFeito &&
          L.tAtq >= a.hitIni && L.tAtq <= a.hitFim) {
        if (corpoAcorpo(L, op, a)) {
          L.hitFeito = true;
          aplicarDano(op, a.dano * L.personagem.poder, a.knock, L.virado,
                      L.personagem.coresKi.projetil, L);
        }
      }

      // SUPER cancela a recuperação de qualquer golpe (ki no máximo!)
      if (inp.sup && L.ki >= 100 && L.estado !== "super" && L.tAtq > a.dur * 0.5) {
        iniciarAtaque(L, "super");
        fisica(L, dt);
        return;
      }

      // fila de combo: pode encomendar o próximo golpe durante a recuperação
      if (!L.proximo && L.tAtq > a.dur * 0.4 &&
          (L.estado === "soco1" || L.estado === "soco2")) {
        if (inp.chute) {
          iniciarAtaque(L, "chute3");
          fisica(L, dt);
          return;
        }
        if (inp.soco && L.tAtq > a.dur * 0.55) L.proximo = "soco2";
      }

      // fila de combo
      if (L.proximo && L.tAtq > a.dur * 0.55) {
        const p = L.proximo;
        L.proximo = null;
        iniciarAtaque(L, p);
        fisica(L, dt);
        return;
      }

      if (L.tAtq >= a.dur) {
        L.ataque = null;
        mudarEstado(L, L.noChao ? "parado" : "pular");
        // combo encadeado imediato
        if (L.proximo) { const p = L.proximo; L.proximo = null; iniciarAtaque(L, p); }
      }
      fisica(L, dt);
      return;
    }

    // ---- segurar KI (carregando feixe) ----
    if (L.segurandoKi > 0) {
      L.aura = 0.6;
      L.corKi = L.personagem.coresKi.feixe;
      if (inp.ki) {
        L.segurandoKi += dt;
        fisica(L, dt);
        return;
      }
      // soltou: decide feixe ou projetil
      const t = L.segurandoKi;
      L.segurandoKi = 0;
      L.aura = 0;
      if (t >= 0.35 && L.ki >= ATAQUES.feixe.custo) iniciarAtaque(L, "feixe");
      else if (L.ki >= ATAQUES.projetil.custo) iniciarAtaque(L, "projetil");
      else fisica(L, dt);
      if (L.ataque) return;
    }

    // ---- neutro: reage ao comando ----
    // giro automático para encarar o oponente
    if (L.noChao) L.virado = op.x >= L.x ? 1 : -1;

    // defesa (segurar trás)
    const defendendo = L.noChao && ((inp.esq && L.virado > 0) || (inp.dir && L.virado < 0));
    if (defendendo) {
      mudarEstado(L, "bloqueio");
      fisica(L, dt);
      return;
    }

    // super com KI cheio
    if (inp.sup && L.ki >= 100) {
      iniciarAtaque(L, "super");
      return;
    }

    // soco / chute (o encadeamento do combo acontece no bloco de ataque)
    if (inp.soco) { iniciarAtaque(L, "soco1"); return; }
    if (inp.chute) { iniciarAtaque(L, "chute"); return; }

    // ki: tap = projetil, segurar = feixe
    if (inp.ki && L.ki >= ATAQUES.projetil.custo) {
      L.segurandoKi = 0.01;
      mudarEstado(L, "projetil");
      L.t = 0;
      return;
    }

    // agachar
    if (inp.baixo && L.noChao) {
      mudarEstado(L, "agachar");
      fisica(L, dt);
      return;
    }

    // pular
    if (inp.cima && L.noChao) {
      L.vy = -VEL_PULO;
      L.noChao = false;
      mudarEstado(L, "pular");
    }

    // no ar sem ataque (ex.: vítima lançada) mantém o sprite de pulo
    if (!L.noChao && L.estado === "parado") mudarEstado(L, "pular");

    // andar
    let mov = 0;
    if (inp.esq) mov -= 1;
    if (inp.dir) mov += 1;
    if (mov !== 0) {
      L.vx = mov * 95 * L.personagem.vel;
      if (L.noChao) mudarEstado(L, "andar");
    } else {
      L.vx *= L.noChao ? 0.4 : 1;
      if (L.noChao && L.estado !== "pular") mudarEstado(L, "parado");
    }

    fisica(L, dt);
  }

  function mudarEstado(L, e) {
    if (L.estado !== e) {
      L.estado = e;
      L.t = 0;
    }
  }

  function iniciarAtaque(L, tipo) {
    const a = ATAQUES[tipo];
    if (a.custo && L.ki < a.custo) return;
    if (a.custo) {
      L.ki -= a.custo;
      if (tipo === "super") { estado.flash = 0.35; estado.shake = 0.5; L.aura = 1; }
      if (tipo === "feixe") L.aura = 0.7;
    }
    L.ataque = a;
    L.estado = tipo;
    L.t = 0;
    L.tAtq = 0;
    L.hitFeito = false;
    L.spawnFeito = false;
    L.proximo = null;
    L.corKi = tipo === "super" ? L.personagem.coresKi.super
            : tipo === "feixe" ? L.personagem.coresKi.feixe
            : L.personagem.coresKi.projetil;
    if (!L.noChao) L.vx = L.virado * 40;
    else L.vx = L.virado * 30;
    atualizarHud();
  }

  function corpoAcorpo(L, op, a) {
    const b = caixaDo(op);
    const ini = L.x + L.virado * 10;
    const x1 = Math.min(ini, ini + L.virado * a.alcance);
    const x2 = Math.max(ini, ini + L.virado * a.alcance);
    const y1 = L.y - 58, y2 = L.y - 6;
    return x1 < b.x2 && x2 > b.x1 && y1 < b.y2 && y2 > b.y1;
  }

  function atirar(L, a) {
    const dir = L.virado;
    const yBase = L.y - (L.estado === "super" ? 34 : 38);
    if (a.custo === ATAQUES.projetil.custo) {
      projeteis.push({
        tipo: "bola", x: L.x + dir * 24, y: yBase,
        vx: dir * 235, vy: 0, w: 14, h: 14,
        cor: L.personagem.coresKi.projetil, dano: 8 * L.personagem.poder,
        knock: 70, dir, dono: L, t: 0, dur: 2.2,
      });
    } else if (a.custo === ATAQUES.feixe.custo) {
      projeteis.push({
        tipo: "feixe", x: L.x + dir * 34, y: yBase,
        vx: dir * 260, vy: 0, w: 74, h: 20,
        cor: L.personagem.coresKi.feixe, dano: 16 * L.personagem.poder,
        knock: 190, dir, dono: L, t: 0, dur: 1.6,
      });
    } else {
      projeteis.push({
        tipo: "super", x: L.x + dir * 44, y: L.y - 36,
        vx: dir * 215, vy: 0, w: 130, h: 34,
        cor: L.personagem.coresKi.super, dano: 34 * L.personagem.poder,
        knock: 260, dir, dono: L, t: 0, dur: 2,
      });
      estado.shake = 0.5;
    }
  }

  function fisica(L, dt) {
    if (!L.noChao) L.vy += GRAV * dt;
    L.x += L.vx * dt;
    L.y += L.vy * dt;
    if (L.y >= CHAO) {
      L.y = CHAO;
      L.vy = 0;
      L.noChao = true;
      if (L.estado === "pular") mudarEstado(L, "parado");
    }
    if (L.noChao) L.vx *= 0.82;
    L.x = Math.max(18, Math.min(W - 18, L.x));
  }

  /* ---------------------------------------------------------
     10. PROJÉTEIS
  --------------------------------------------------------- */
  function updProjeteis(dt) {
    projeteis.forEach((s) => {
      s.x += s.vx * dt;
      s.t += dt;
      s.dur -= dt;
      const alvo = s.dono === L1 ? L2 : L1;
      const b = caixaDo(alvo);
      const sx1 = s.x - s.w / 2, sx2 = s.x + s.w / 2;
      const sy1 = s.y - s.h / 2, sy2 = s.y + s.h / 2;
      if (sx1 < b.x2 && sx2 > b.x1 && sy1 < b.y2 && sy2 > b.y1) {
        aplicarDano(alvo, s.dano, s.knock, s.dir, s.cor, s.dono);
        s.dur = 0;
      }
      if (s.x < -160 || s.x > W + 160) s.dur = 0;
    });
    projeteis = projeteis.filter((s) => s.dur > 0);
  }

  function updParticulas(dt) {
    particulas.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; });
    particulas = particulas.filter((p) => p.life > 0);
  }

  /* ---------------------------------------------------------
     11. ROUNDS E FIM DE LUTA
  --------------------------------------------------------- */
  function terminarRound(vencedor) {
    if (luta.fase !== "luta") return;
    luta.fase = "ko";
    luta.faseT = 2.2;
    vencedor.wins++;
    vencedor.estado = "vitoria";
    vencedor.t = 0;
    const perdedor = vencedor === L1 ? L2 : L1;
    if (perdedor.hp <= 0) { perdedor.estado = "caido"; perdedor.t = 0; }
    mostrarAviso("K.O.!", true);
    atualizarHud();
  }

  function fimPorTempo() {
    if (L1.hp === L2.hp) {
      luta.fase = "ko";
      luta.faseT = 2;
      mostrarAviso("EMPATE!", true);
      return;
    }
    terminarRound(L1.hp > L2.hp ? L1 : L2);
  }

  function proximoPasso(dt) {
    luta.faseT -= dt;

    if (luta.fase === "intro" && luta.faseT <= 0) {
      luta.fase = "luta";
      mostrarAviso("LUTEM!");
    }

    if (luta.fase === "ko" && luta.faseT <= 0) {
      const venceu = L1.wins >= 2 || L2.wins >= 2;
      if (venceu) {
        luta.fase = "fim";
        setTimeout(mostrarResultado, 400);
      } else {
        iniciarRound(luta.round + 1);
      }
    }
  }

  function mostrarResultado() {
    hud.classList.add("oculto");
    const p1venceu = L1.wins > L2.wins;
    const titulo = $("resTitulo");
    const texto = $("resTexto");

    if (estado.modo === 1) {
      titulo.textContent = p1venceu ? "VITÓRIA!" : "DERROTA!";
      texto.textContent = p1venceu
        ? `${estado.jogador} derrotou a CPU! Você é o guerreiro mais forte.`
        : `A CPU venceu por ${L2.wins} a ${L1.wins}. Treine mais e volte mais forte!`;
    } else {
      titulo.textContent = p1venceu ? "JOGADOR 1 VENCEU!" : "JOGADOR 2 VENCEU!";
      texto.textContent = `Placar final: ${L1.wins} x ${L2.wins} — ${L1.personagem.nome} vs ${L2.personagem.nome}`;
    }
    telas.resultado.classList.remove("oculta");
  }

  /* ---------------------------------------------------------
     12. HUD
  --------------------------------------------------------- */
  function atualizarHud() {
    if (!L1) return;
    $("hp1").style.width = (L1.hp / L1.hpMax) * 100 + "%";
    $("hp2").style.width = (L2.hp / L2.hpMax) * 100 + "%";
    $("ki1").style.width = L1.ki + "%";
    $("ki2").style.width = L2.ki + "%";
    $("ki1").parentElement.classList.toggle("cheia", L1.ki >= 100);
    $("ki2").parentElement.classList.toggle("cheia", L2.ki >= 100);
    $("crono").textContent = Math.ceil(luta.tempo);
    $("roundTxt").textContent = `ROUND ${luta.round}`;
    ["pips1", "pips2"].forEach((id, i) => {
      const wins = i === 0 ? L1.wins : L2.wins;
      $(id).innerHTML = "<b class='" + (wins > 0 ? "on" : "") + "'></b><b class='" + (wins > 1 ? "on" : "") + "'></b>";
    });
  }

  /* ---------------------------------------------------------
     13. LOOP PRINCIPAL
  --------------------------------------------------------- */
  let ultimo = performance.now();

  function loop(agora) {
    const dt = Math.min(0.05, (agora - ultimo) / 1000);
    ultimo = agora;
    const t = agora / 1000;

    if (luta && estado.tela === "luta") {
      // ---- atualização ----
      if (luta.fase === "luta") {
        luta.tempo -= dt;
        const in1 = lerEntrada(0);
        const in2 = estado.modo === 1 ? entradaIA(dt) : lerEntrada(1);
        updLutador(L1, in1, L2, dt);
        if (luta.fase === "luta") updLutador(L2, in2, L1, dt);
        updProjeteis(dt);
        if (luta.tempo <= 0) { luta.tempo = 0; fimPorTempo(); }
        atualizarHud();
      } else if (luta.fase !== "fim") {
        // pausa breve: mantém física/estética rodando
        updLutador(L1, vazio(), L2, dt);
        updLutador(L2, vazio(), L1, dt);
        updProjeteis(dt);
        proximoPasso(dt);
      }
      updParticulas(dt);
      estado.shake = Math.max(0, estado.shake - dt * 2);
      estado.flash = Math.max(0, estado.flash - dt * 2);
    } else {
      updParticulas(dt);
    }

    // ---- desenho ----
    ctx.save();
    if (estado.shake > 0) {
      const s = estado.shake * 7;
      ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
    }
    desenharCenario(ctx, estado.cenario.id, t, W, H);

    if (luta && estado.tela === "luta") {
      projeteis.forEach((s) => desenharProjecil(ctx, s));
      // ordem: quem está mais à esquerda desenha primeiro
      const ordem = L1.x < L2.x ? [L1, L2] : [L2, L1];
      ordem.forEach((L) => desenharLutador(ctx, L, t));
      particulas.forEach((p) => desenharParticula(ctx, p));
    } else {
      // menu: herói e vilão de vitrine andando
      mostrarVitrine(ctx, t);
    }

    if (estado.flash > 0) {
      ctx.globalAlpha = Math.min(1, estado.flash * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    bordas.clear();
    requestAnimationFrame(loop);
  }

  function vazio() {
    return { esq: false, dir: false, cima: false, baixo: false, soco: false,
             chute: false, sup: false, ki: false, kiSoltou: true };
  }

  /* Vitrine animada atrás dos menus */
  let vitrine = null;
  function mostrarVitrine(c, t) {
    if (!vitrine) {
      vitrine = [
        novoLutador(acharPersonagem("goku"), 170, 1),
        novoLutador(acharPersonagem("freeza"), W - 170, -1),
      ];
      vitrine[0].wins = 0;
    }
    vitrine.forEach((L, i) => {
      L.estado = Math.sin(t * 1.4 + i * 2) > 0.55 ? "soco1" : "andar";
      L.t = (L.t || 0);
      if (L.estado === "soco1") {
        L.ataque = ATAQUES.soco1;
        L.tAtq = (t * 2 + i) % ATAQUES.soco1.dur;
      } else {
        L.ataque = null;
      }
      L.x = (i === 0 ? 170 : W - 170) + Math.sin(t * 0.7 + i * 3) * 40;
      desenharLutador(c, L, t);
      L.ataque = null;
    });
  }

  /* ---------------------------------------------------------
     14. TELAS E FLUXO
  --------------------------------------------------------- */
  function mostrarTela(nome) {
    Object.values(telas).forEach((el) => el.classList.add("oculta"));
    // "luta" é o próprio canvas (sem overlay), por isso pode não existir em `telas`
    if (telas[nome]) telas[nome].classList.remove("oculta");
    estado.tela = nome === "resultado" ? "luta" : nome;
  }

  // ---- login ----
  function entrar() {
    const nome = $("inpNome").value.trim() || "Guerreiro";
    estado.jogador = nome;
    localStorage.setItem("zk_nome", nome);
    mostrarTela("menu");
    $("olaNome").textContent = `OLÁ, ${nome.toUpperCase()}`;
  }
  $("btnEntrar").addEventListener("click", entrar);
  $("inpNome").addEventListener("keydown", (e) => { if (e.key === "Enter") entrar(); });

  // ---- menu ----
  $("btn1Jogador").addEventListener("click", () => { estado.modo = 1; abrirSelecao(); });
  $("btn2Jogadores").addEventListener("click", () => { estado.modo = 2; abrirSelecao(); });
  $("btnTrocar").addEventListener("click", () => mostrarTela("login"));

  // ---- seleção de personagem ----
  function abrirSelecao() {
    estado.escolha = [null, null];
    estado.rodando = 0;
    mostrarTela("select");
    montarGrade();
    atualizarSlots();
  }

  function montarGrade() {
    const grade = $("grade");
    grade.innerHTML = "";
    PERSONAGENS.forEach((p) => {
      const cartao = document.createElement("div");
      cartao.className = `cartao ${p.lado === "HERÓI" ? "heroi" : "vilao"}`;
      cartao.dataset.id = p.id;

      const cv = document.createElement("canvas");
      desenharRetrato(cv, p);

      const nome = document.createElement("b");
      nome.textContent = p.nome;
      const lado = document.createElement("i");
      lado.textContent = p.lado;

      cartao.append(cv, nome, lado);
      cartao.addEventListener("click", () => escolher(p));
      grade.appendChild(cartao);
    });
  }

  function escolher(p) {
    estado.escolha[estado.rodando] = p;
    if (estado.rodando === 0) {
      estado.rodando = 1;
      // modo 1: a CPU escolhe sozinha um adversário aleatório
      if (estado.modo === 1) {
        const resto = PERSONAGENS.filter((x) => x.id !== p.id);
        estado.escolha[1] = resto[Math.floor(Math.random() * resto.length)];
      }
      atualizarSlots();
      if (estado.modo === 1) $("btnIrCenario").disabled = false;
    } else {
      atualizarSlots();
      $("btnIrCenario").disabled = false;
    }
  }

  function atualizarSlots() {
    [1, 2].forEach((n, i) => {
      const slot = $(`slot${n}`);
      slot.classList.toggle("ativo", estado.rodando === i);
      const p = estado.escolha[i];
      slot.querySelector(".quem").textContent =
        i === 0 ? "JOGADOR 1" : (estado.modo === 1 ? "COMPUTADOR" : "JOGADOR 2");
      slot.querySelector(".quem-nome").textContent = p ? p.nome : "—";
      slot.querySelector(".quem-golpes").textContent = p
        ? `${p.golpes.feixe} · ${p.golpes.super}` : "";
    });
    // realça cartões escolhidos
    document.querySelectorAll(".cartao").forEach((el) => {
      el.classList.toggle("p1", estado.escolha[0] && el.dataset.id === estado.escolha[0].id);
      el.classList.toggle("p2", estado.escolha[1] && el.dataset.id === estado.escolha[1].id);
    });
    $("btnIrCenario").disabled = !(estado.escolha[0] && estado.escolha[1]);
  }

  $("btnVoltarMenu").addEventListener("click", () => mostrarTela("menu"));

  // ---- cenário ----
  $("btnIrCenario").addEventListener("click", () => {
    mostrarTela("cenario");
    const box = $("cenarios");
    box.innerHTML = "";
    CENARIOS.forEach((cen) => {
      const div = document.createElement("div");
      div.className = "cenario";
      const cv = document.createElement("canvas");
      desenharMiniCenario(cv, cen.id);
      const nome = document.createElement("b");
      nome.textContent = cen.nome;
      const anime = document.createElement("i");
      anime.textContent = cen.anime;
      div.append(cv, nome, anime);
      div.addEventListener("click", () => {
        estado.cenario = cen;
        iniciarLuta();
      });
      box.appendChild(div);
    });
  });

  $("btnVoltarSelect").addEventListener("click", () => mostrarTela("select"));

  // ---- luta ----
  function iniciarLuta() {
    mostrarTela("luta");
    novaLuta();
  }

  $("btnRevanche").addEventListener("click", () => {
    mostrarTela("luta");
    novaLuta();
  });
  $("btnMenu").addEventListener("click", () => {
    hud.classList.add("oculto");
    luta = null;
    mostrarTela("menu");
  });

  /* ---------------------------------------------------------
     15. INÍCIO
  --------------------------------------------------------- */
  const nomeSalvo = localStorage.getItem("zk_nome");
  if (nomeSalvo) $("inpNome").value = nomeSalvo;
  mostrarTela("login");
  requestAnimationFrame(loop);
})();
