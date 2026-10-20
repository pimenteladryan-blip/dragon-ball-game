/* =========================================================
   DRAGON BALL: BATALHA DE KI
   Jogo web — HTML + CSS + JavaScript
   ---------------------------------------------------------
   Regras:
   • O jogador é um guerreiro que voa pelo céu e ataca com Ki.
   • São 5 ondas de inimigos; a onda 5 possui o CHEFÃO final.
   • Objetivo: sobreviver às ondas e derrotar o chefão (VITÓRIA).
   • Derrota: a barra de VIDA chegar a 0.
   ========================================================= */

(() => {
  "use strict";

  /* ---------------------------------------------------------
     1. CONFIGURAÇÕES E CONSTANTES
  --------------------------------------------------------- */
  const CFG = {
    W: 480,
    H: 640,
    playerSpeed: 270,
    playerMaxHp: 100,
    playerRadius: 16,
    fireInterval: 0.20,      // segundos entre tiros
    bulletSpeed: 560,
    bulletDamage: 12,
    kiMax: 100,
    kiRegen: 9,              // ki por segundo
    specialCost: 50,
    specialDamage: 55,
    invulTime: 1.0,          // segundos de invulnerabilidade ao levar dano
    totalWaves: 5,
    highScoreKey: "dbk_highscore",
  };

  const ENEMY_TYPES = {
    sai:  { hp: 20,  radius: 14, score: 100,  color: "#3fbf3f", contact: 15 },
    gun:  { hp: 45,  radius: 17, score: 250,  color: "#9b4fd6", contact: 20 },
    boss: { hp: 750, radius: 48, score: 3000, color: "#2fd67a", contact: 30 },
  };

  /* ---------------------------------------------------------
     2. REFERÊNCIAS DA INTERFACE
  --------------------------------------------------------- */
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const ui = {
    score: document.getElementById("score"),
    wave: document.getElementById("wave"),
    high: document.getElementById("highscore"),
    hpBar: document.getElementById("hpBar"),
    kiBar: document.getElementById("kiBar"),
    menu: document.getElementById("menuScreen"),
    pause: document.getElementById("pauseScreen"),
    end: document.getElementById("endScreen"),
    endTitle: document.getElementById("endTitle"),
    endText: document.getElementById("endText"),
    endScore: document.getElementById("endScore"),
    waveAlert: document.getElementById("waveAlert"),
    btnStart: document.getElementById("btnStart"),
    btnResume: document.getElementById("btnResume"),
    btnRestart: document.getElementById("btnRestart"),
    btnFire: document.getElementById("btnFire"),
    btnSpecial: document.getElementById("btnSpecial"),
  };

  /* ---------------------------------------------------------
     3. ESTADO DO JOGO
  --------------------------------------------------------- */
  const state = {
    mode: "menu",            // menu | playing | paused | over
    score: 0,
    wave: 0,
    high: Number(localStorage.getItem(CFG.highScoreKey) || 0),
    shake: 0,
    flash: 0,                // clarão do Kamehameha
    beam: 0,                 // duração visual do feixe
    victory: false,
  };

  const player = {
    x: CFG.W / 2,
    y: CFG.H - 110,
    r: CFG.playerRadius,
    hp: CFG.playerMaxHp,
    ki: CFG.kiMax,
    fireCd: 0,
    invul: 0,
    tilt: 0,
  };

  const waveState = { queue: [], timer: 0, transition: 0, alerted: false };

  let bullets = [];    // tiros do jogador
  let eBullets = [];   // tiros dos inimigos
  let enemies = [];
  let powerups = [];
  let particles = [];
  let floaters = [];   // textos flutuantes (+100)
  let stars = [];

  /* ---------------------------------------------------------
     4. UTILIDADES
  --------------------------------------------------------- */
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist2 = (ax, ay, bx, by) => {
    const dx = ax - bx, dy = ay - by;
    return dx * dx + dy * dy;
  };

  function initStars() {
    stars = [];
    for (let i = 0; i < 70; i++) {
      stars.push({
        x: rand(0, CFG.W),
        y: rand(0, CFG.H),
        size: rand(0.6, 2.2),
        speed: rand(15, 90),
        tw: rand(0, Math.PI * 2),
      });
    }
  }

  function addParticles(x, y, color, amount, power = 1) {
    for (let i = 0; i < amount; i++) {
      const a = rand(0, Math.PI * 2);
      const s = rand(40, 260) * power;
      particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: rand(0.25, 0.7),
        maxLife: 0.7,
        size: rand(2, 5),
        color,
      });
    }
  }

  function addFloater(x, y, text, color = "#ffd21e") {
    floaters.push({ x, y, text, color, life: 1 });
  }

  function updateHud() {
    ui.score.textContent = state.score;
    ui.high.textContent = state.high;
    ui.wave.textContent = `${Math.max(1, state.wave)} / ${CFG.totalWaves}`;
    ui.hpBar.style.width = clamp(player.hp / CFG.playerMaxHp * 100, 0, 100) + "%";
    ui.kiBar.style.width = clamp(player.ki / CFG.kiMax * 100, 0, 100) + "%";
  }

  function showWaveAlert(text) {
    ui.waveAlert.textContent = text;
    ui.waveAlert.classList.remove("hidden");
    // reinicia a animação CSS
    void ui.waveAlert.offsetWidth;
    ui.waveAlert.style.animation = "none";
    void ui.waveAlert.offsetWidth;
    ui.waveAlert.style.animation = "";
    setTimeout(() => ui.waveAlert.classList.add("hidden"), 1600);
  }

  /* ---------------------------------------------------------
     5. ONDAS DE INIMIGOS
  --------------------------------------------------------- */
  function buildWave(n) {
    const q = [];
    const add = (t, type) => q.push({ t, type });

    if (n === 1) {
      for (let i = 0; i < 5; i++) add(0.6 + i * 0.9, "sai");
    } else if (n === 2) {
      for (let i = 0; i < 6; i++) add(0.5 + i * 0.7, "sai");
      add(3.5, "gun");
      add(5.5, "gun");
    } else if (n === 3) {
      for (let i = 0; i < 4; i++) add(0.5 + i * 0.6, "sai");
      for (let i = 0; i < 3; i++) add(1.2 + i * 1.4, "gun");
    } else if (n === 4) {
      for (let i = 0; i < 6; i++) add(0.4 + i * 0.5, "sai");
      for (let i = 0; i < 4; i++) add(1.5 + i * 1.1, "gun");
    } else if (n === 5) {
      add(1.0, "boss");   // CHEFÃO
    }

    waveState.queue = q;
    waveState.timer = 0;
    waveState.transition = 0;
    waveState.alerted = false;
  }

  function startWave(n) {
    state.wave = n;
    buildWave(n);
    const boss = n === CFG.totalWaves;
    showWaveAlert(boss ? "ONDA 5 — CELL!" : `ONDA ${n}`);
    updateHud();
  }

  function spawnEnemy(type) {
    const base = ENEMY_TYPES[type];
    const e = {
      type,
      x: rand(40, CFG.W - 40),
      y: -60,
      r: base.radius,
      hp: base.hp,
      maxHp: base.hp,
      score: base.score,
      color: base.color,
      contact: base.contact,
      t: 0,
      shootCd: rand(1, 2.2),
      seed: rand(0, Math.PI * 2),
      spawnCd: 7,      // chefão: spawn de adds
      entering: true,
    };

    if (type === "gun") e.targetY = rand(70, 170);
    if (type === "boss") { e.x = CFG.W / 2; e.y = -100; }

    enemies.push(e);
  }

  /* ---------------------------------------------------------
     6. IA DOS INIMIGOS
  --------------------------------------------------------- */
  function updateEnemy(e, dt) {
    e.t += dt;

    if (e.type === "sai") {
      // entra e mergulha em zigue-zague
      if (e.entering) {
        e.y += 130 * dt;
        e.x += Math.sin(e.t * 3 + e.seed) * 90 * dt;
        if (e.y > 60) e.entering = false;
      } else {
        e.y += (110 + 40 * Math.sin(e.seed)) * dt;
        e.x += Math.sin(e.t * 2.5 + e.seed) * 130 * dt;
        // de vez em quando tenta mirar no jogador
        if (Math.sin(e.t * 1.7 + e.seed) > 0.95) {
          e.x += Math.sign(player.x - e.x) * 90 * dt;
        }
      }
    }

    else if (e.type === "gun") {
      if (e.entering) {
        e.y += 110 * dt;
        if (e.y >= e.targetY) e.entering = false;
      } else {
        // patrulha lateralmente
        e.x += Math.cos(e.t * 1.2 + e.seed) * 110 * dt;
        e.y += Math.sin(e.t * 0.9 + e.seed) * 22 * dt;
        e.x = clamp(e.x, e.r, CFG.W - e.r);

        e.shootCd -= dt;
        if (e.shootCd <= 0) {
          e.shootCd = rand(1.3, 2.1);
          shootAtPlayer(e.x, e.y, 230, "#e05bff", 8);
        }
      }
    }

    else if (e.type === "boss") {
      if (e.entering) {
        e.y += 90 * dt;
        if (e.y >= 120) e.entering = false;
      } else {
        e.x += Math.cos(e.t * 0.8) * 105 * dt;
        e.y = 120 + Math.sin(e.t * 1.3) * 26;
        e.x = clamp(e.x, e.r + 6, CFG.W - e.r - 6);

        e.shootCd -= dt;
        if (e.shootCd <= 0) {
          e.shootCd = e.hp < e.maxHp * 0.4 ? 0.85 : 1.35;
          // leque de 5 tiros
          for (let i = -2; i <= 2; i++) {
            const ang = Math.atan2(player.y - e.y, player.x - e.x) + i * 0.22;
            eBullets.push({
              x: e.x, y: e.y + 20,
              vx: Math.cos(ang) * 250,
              vy: Math.sin(ang) * 250,
              r: 7, damage: 9, color: "#7dff9c",
            });
          }
        }

        // invoca subordinados
        e.spawnCd -= dt;
        const minions = enemies.filter(m => m.type !== "boss").length;
        if (e.spawnCd <= 0 && minions < 4) {
          e.spawnCd = 6;
          spawnEnemy("sai");
          addFloater(e.x, e.y - 40, "SAIBAMEN!", "#7dff9c");
        }
      }
    }

    // saiu de cena (exceto chefão)
    if (e.y > CFG.H + 70) e.dead = true;
  }

  function shootAtPlayer(x, y, speed, color, damage) {
    const ang = Math.atan2(player.y - y, player.x - x);
    eBullets.push({
      x, y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      r: 6, damage, color,
    });
  }

  /* ---------------------------------------------------------
     7. CONTROLES
  --------------------------------------------------------- */
  const keys = { up: false, down: false, left: false, right: false, fire: false };
  const KEYMAP = {
    ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
    KeyW: "up", KeyS: "down", KeyA: "left", KeyD: "right",
    Space: "fire",
  };

  window.addEventListener("keydown", (ev) => {
    if (KEYMAP[ev.code]) { keys[KEYMAP[ev.code]] = true; ev.preventDefault(); }

    if (ev.code === "ShiftLeft" || ev.code === "ShiftRight") specialAttack();
    if (ev.code === "KeyP" || ev.code === "Escape") togglePause();
    if (ev.code === "Enter" && state.mode === "menu") startGame();
    if (ev.code === "Enter" && state.mode === "over") startGame();
  });

  window.addEventListener("keyup", (ev) => {
    if (KEYMAP[ev.code]) { keys[KEYMAP[ev.code]] = false; ev.preventDefault(); }
  });

  // Tiro segurando o mouse no canvas
  canvas.addEventListener("pointerdown", (ev) => {
    if (state.mode !== "playing") return;
    keys.fire = true;
    moveToward(ev);
    canvas.setPointerCapture(ev.pointerId);
  });
  canvas.addEventListener("pointermove", (ev) => {
    if (state.mode === "playing" && ev.buttons) moveToward(ev);
  });
  canvas.addEventListener("pointerup", () => { keys.fire = false; });
  canvas.addEventListener("pointercancel", () => { keys.fire = false; });

  function moveToward(ev) {
    const rect = canvas.getBoundingClientRect();
    const tx = (ev.clientX - rect.left) * (CFG.W / rect.width);
    const ty = (ev.clientY - rect.top) * (CFG.H / rect.height);
    player.tx = tx;
    player.ty = ty;
  }

  // Botões de toque (mobile)
  document.querySelectorAll(".dpad-btn").forEach((btn) => {
    const dir = btn.dataset.dir;
    const on = (ev) => { ev.preventDefault(); keys[dir] = true; };
    const off = (ev) => { ev.preventDefault(); keys[dir] = false; };
    btn.addEventListener("pointerdown", on);
    btn.addEventListener("pointerup", off);
    btn.addEventListener("pointerleave", off);
    btn.addEventListener("pointercancel", off);
  });

  ui.btnFire.addEventListener("pointerdown", (ev) => { ev.preventDefault(); keys.fire = true; });
  ["pointerup", "pointerleave", "pointercancel"].forEach((evt) =>
    ui.btnFire.addEventListener(evt, () => { keys.fire = false; })
  );
  ui.btnSpecial.addEventListener("click", (ev) => { ev.preventDefault(); specialAttack(); });

  /* ---------------------------------------------------------
     8. AÇÕES DO JOGADOR
  --------------------------------------------------------- */
  function playerShoot() {
    bullets.push({
      x: player.x, y: player.y - 22,
      vx: 0, vy: -CFG.bulletSpeed,
      r: 6, damage: CFG.bulletDamage, color: "#ffd21e",
    });
    // pequenos tiros laterais
    bullets.push({
      x: player.x - 10, y: player.y - 12,
      vx: -40, vy: -CFG.bulletSpeed * 0.92,
      r: 4, damage: CFG.bulletDamage * 0.5, color: "#ff9d2e",
    });
    bullets.push({
      x: player.x + 10, y: player.y - 12,
      vx: 40, vy: -CFG.bulletSpeed * 0.92,
      r: 4, damage: CFG.bulletDamage * 0.5, color: "#ff9d2e",
    });
    addParticles(player.x, player.y - 20, "#ffd21e", 3, 0.4);
  }

  function specialAttack() {
    if (state.mode !== "playing") return;
    if (player.ki < CFG.specialCost) {
      addFloater(player.x, player.y - 40, "KI INSUFICIENTE!", "#1e9bff");
      return;
    }
    player.ki -= CFG.specialCost;
    state.beam = 0.55;
    state.flash = 0.35;
    state.shake = 0.4;

    // dano em TODOS os inimigos
    enemies.forEach((e) => {
      damageEnemy(e, e.type === "boss" ? CFG.specialDamage * 2.2 : CFG.specialDamage + 40);
    });
    addParticles(player.x, player.y - 30, "#7de8ff", 40, 1.6);
    updateHud();
  }

  function takeDamage(amount) {
    if (player.invul > 0 || state.mode !== "playing") return;
    player.hp -= amount;
    player.invul = CFG.invulTime;
    state.shake = 0.35;
    addParticles(player.x, player.y, "#ff5a5a", 18, 1.2);
    updateHud();
    if (player.hp <= 0) {
      player.hp = 0;
      endGame(false);
    }
  }

  /* ---------------------------------------------------------
     9. DANO / MORTE DE INIMIGOS
  --------------------------------------------------------- */
  function damageEnemy(e, dmg) {
    if (e.dead) return;
    e.hp -= dmg;
    e.hit = 0.12;
    addParticles(e.x, e.y, e.color, 4, 0.6);
    if (e.hp <= 0) killEnemy(e);
  }

  function killEnemy(e) {
    e.dead = true;
    state.score += e.score;
    addFloater(e.x, e.y, `+${e.score}`);
    addParticles(e.x, e.y, e.color, e.type === "boss" ? 70 : 16, e.type === "boss" ? 1.8 : 1);
    addParticles(e.x, e.y, "#ffd21e", e.type === "boss" ? 50 : 8, 1.1);

    if (e.type === "boss") {
      state.shake = 0.9;
      state.flash = 0.5;
      // solta as 7 esferas!
      for (let i = 0; i < 7; i++) {
        powerups.push({
          x: e.x + rand(-50, 50), y: e.y + rand(-30, 30),
          vy: 60, type: "ball", r: 13, t: rand(0, 6), stars: i + 1,
        });
      }
    } else {
      state.shake = Math.max(state.shake, 0.15);
      if (Math.random() < 0.16) {
        powerups.push({
          x: e.x, y: e.y, vy: 70, r: 13, t: 0,
          type: Math.random() < 0.5 ? "senzu" : "ball",
          stars: 1 + Math.floor(Math.random() * 7),
        });
      }
    }

    if (state.score > state.high) {
      state.high = state.score;
      localStorage.setItem(CFG.highScoreKey, String(state.high));
    }
    updateHud();
  }

  /* ---------------------------------------------------------
     10. ATUALIZAÇÃO (UPDATE)
  --------------------------------------------------------- */
  function update(dt) {
    // ---- fundo ----
    stars.forEach((s) => {
      s.y += s.speed * dt;
      s.tw += dt * 3;
      if (s.y > CFG.H) { s.y = -4; s.x = rand(0, CFG.W); }
    });

    // ---- efeitos ----
    state.shake = Math.max(0, state.shake - dt);
    state.flash = Math.max(0, state.flash - dt);
    state.beam = Math.max(0, state.beam - dt);
    player.invul = Math.max(0, player.invul - dt);
    player.ki = Math.min(CFG.kiMax, player.ki + CFG.kiRegen * dt);

    // ---- movimento do jogador ----
    let vx = 0, vy = 0;
    if (keys.left) vx -= 1;
    if (keys.right) vx += 1;
    if (keys.up) vy -= 1;
    if (keys.down) vy += 1;

    if (vx || vy) {
      const len = Math.hypot(vx, vy);
      player.x += (vx / len) * CFG.playerSpeed * dt;
      player.y += (vy / len) * CFG.playerSpeed * dt;
      player.tx = null; // teclado tem prioridade
      player.tilt = clamp(vx * 0.35, -0.4, 0.4);
    } else if (player.tx != null) {
      // segue o dedo / mouse
      const dx = player.tx - player.x;
      const dy = player.ty - player.y;
      const d = Math.hypot(dx, dy);
      if (d > 4) {
        const step = Math.min(d, 620 * dt);
        player.x += (dx / d) * step;
        player.y += (dy / d) * step;
        player.tilt = clamp(dx / 60, -0.4, 0.4);
      }
    } else {
      player.tilt *= 0.9;
    }

    player.x = clamp(player.x, player.r, CFG.W - player.r);
    player.y = clamp(player.y, 80, CFG.H - player.r - 6);

    // ---- tiro ----
    player.fireCd -= dt;
    if (keys.fire && player.fireCd <= 0) {
      player.fireCd = CFG.fireInterval;
      playerShoot();
    }

    // ---- fila de spawn da onda ----
    waveState.timer += dt;
    while (waveState.queue.length && waveState.queue[0].t <= waveState.timer) {
      spawnEnemy(waveState.queue.shift().type);
    }

    // ---- transição entre ondas ----
    if (!waveState.queue.length && !enemies.length && waveState.transition <= 0 && !waveState.alerted) {
      waveState.alerted = true;
      if (state.wave >= CFG.totalWaves) { endGame(true); return; }
      state.score += 500 * state.wave;
      addFloater(player.x, player.y - 60, `ONDA ${state.wave} VENCIDA! +${500 * state.wave}`);
      waveState.transition = 2.0;
      updateHud();
    }
    if (waveState.transition > 0) {
      waveState.transition -= dt;
      if (waveState.transition <= 0) startWave(state.wave + 1);
    }

    // ---- inimigos ----
    enemies.forEach((e) => {
      updateEnemy(e, dt);
      if (e.hit > 0) e.hit -= dt;

      // contato com o jogador
      if (!e.dead && dist2(e.x, e.y, player.x, player.y) < (e.r + player.r) ** 2) {
        takeDamage(e.contact);
        if (e.type !== "boss") killEnemy(e);
      }
    });
    enemies = enemies.filter((e) => !e.dead);

    // ---- projéteis do jogador ----
    bullets.forEach((b) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.y < -20 || b.x < -20 || b.x > CFG.W + 20) { b.dead = true; return; }
      for (const e of enemies) {
        if (e.dead) continue;
        if (dist2(b.x, b.y, e.x, e.y) < (b.r + e.r) ** 2) {
          damageEnemy(e, b.damage);
          b.dead = true;
          break;
        }
      }
    });
    bullets = bullets.filter((b) => !b.dead);

    // ---- projéteis inimigos ----
    eBullets.forEach((b) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.y > CFG.H + 20 || b.y < -20 || b.x < -20 || b.x > CFG.W + 20) { b.dead = true; return; }
      if (dist2(b.x, b.y, player.x, player.y) < (b.r + player.r) ** 2) {
        b.dead = true;
        takeDamage(b.damage);
      }
    });
    eBullets = eBullets.filter((b) => !b.dead);

    // ---- itens ----
    powerups.forEach((p) => {
      p.t += dt;
      p.y += p.vy * dt;
      p.x += Math.sin(p.t * 2) * 25 * dt;
      if (p.y > CFG.H + 30) { p.dead = true; return; }
      if (dist2(p.x, p.y, player.x, player.y) < (p.r + player.r + 6) ** 2) {
        p.dead = true;
        if (p.type === "senzu") {
          player.hp = Math.min(CFG.playerMaxHp, player.hp + 40);
          addFloater(player.x, player.y - 40, "SENUZU +40", "#42d94a");
        } else {
          player.ki = CFG.kiMax;
          state.score += 250;
          addFloater(player.x, player.y - 40, `ESFERA DO DRAGÃO +250`, "#ffd21e");
        }
        addParticles(p.x, p.y, "#ffd21e", 14, 1);
        updateHud();
      }
    });
    powerups = powerups.filter((p) => !p.dead);

    // ---- partículas / textos ----
    particles.forEach((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.life -= dt;
    });
    particles = particles.filter((p) => p.life > 0);

    floaters.forEach((f) => { f.y -= 40 * dt; f.life -= dt; });
    floaters = floaters.filter((f) => f.life > 0);
  }

  /* ---------------------------------------------------------
     11. DESENHO (RENDER)
  --------------------------------------------------------- */
  function render(dt) {
    ctx.save();

    // screen shake
    if (state.shake > 0) {
      const s = state.shake * 14;
      ctx.translate(rand(-s, s), rand(-s, s));
    }

    // ---- céu ----
    const sky = ctx.createLinearGradient(0, 0, 0, CFG.H);
    sky.addColorStop(0, "#160b3d");
    sky.addColorStop(0.55, "#0a0620");
    sky.addColorStop(1, "#1c0d02");
    ctx.fillStyle = sky;
    ctx.fillRect(-20, -20, CFG.W + 40, CFG.H + 40);

    // nuvens douradas (terra do pôr do sol)
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "#f7931e";
    for (let i = 0; i < 3; i++) {
      const y = CFG.H - 60 - i * 55;
      ctx.beginPath();
      ctx.ellipse(CFG.W / 2 + Math.sin(state.shake + i) * 30, y, 240 - i * 40, 26, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ---- estrelas ----
    stars.forEach((s) => {
      const tw = 0.5 + Math.sin(s.tw) * 0.5;
      ctx.globalAlpha = 0.3 + tw * 0.7;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    if (state.mode !== "menu") {
      drawBeam();
      powerups.forEach(drawPowerup);
      bullets.forEach((b) => drawOrb(b.x, b.y, b.r, b.color));
      eBullets.forEach((b) => drawOrb(b.x, b.y, b.r, b.color));
      enemies.forEach(drawEnemy);
      drawPlayer();
      drawParticles();
      drawFloaters();
      if (enemies.some((e) => e.type === "boss")) drawBossBar();
    }

    // clarão branco (especial / vitória)
    if (state.flash > 0) {
      ctx.globalAlpha = clamp(state.flash * 2, 0, 1);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-20, -20, CFG.W + 40, CFG.H + 40);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  function drawOrb(x, y, r, color) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.4, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPlayer() {
    const { x, y } = player;
    const blink = player.invul > 0 && Math.floor(player.invul * 12) % 2 === 0;
    if (blink) return;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(player.tilt * 0.35);

    // aura de ki
    const pulse = 1 + Math.sin(performance.now() / 120) * 0.08;
    const aura = ctx.createRadialGradient(0, 0, 6, 0, 0, 42 * pulse);
    aura.addColorStop(0, "rgba(255,210,30,.55)");
    aura.addColorStop(0.6, "rgba(247,147,30,.22)");
    aura.addColorStop(1, "rgba(247,147,30,0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, 44 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // pernas / calça azul
    ctx.fillStyle = "#1449b8";
    ctx.fillRect(-9, 6, 7, 12);
    ctx.fillRect(2, 6, 7, 12);

    // gi laranja (torso)
    ctx.fillStyle = "#f7931e";
    ctx.strokeStyle = "#7a2d00";
    ctx.lineWidth = 2;
    roundRect(-12, -8, 24, 18, 5);
    ctx.fill();
    ctx.stroke();

    // faixa azul
    ctx.fillStyle = "#1449b8";
    ctx.fillRect(-12, 3, 24, 4);

    // braços com ki
    ctx.fillStyle = "#f7931e";
    ctx.beginPath();
    ctx.arc(-13, 0, 5, 0, Math.PI * 2);
    ctx.arc(13, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    drawOrb(-14, -6, 5, "#7de8ff");
    drawOrb(14, -6, 5, "#7de8ff");

    // cabeça
    ctx.fillStyle = "#f6c99a";
    ctx.strokeStyle = "#5a3a1a";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -15, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // cabelo espetado preto
    ctx.fillStyle = "#101018";
    ctx.beginPath();
    ctx.moveTo(-9, -18);
    ctx.lineTo(-12, -32);
    ctx.lineTo(-5, -23);
    ctx.lineTo(-3, -35);
    ctx.lineTo(2, -24);
    ctx.lineTo(7, -33);
    ctx.lineTo(8, -21);
    ctx.lineTo(13, -27);
    ctx.lineTo(9, -16);
    ctx.closePath();
    ctx.fill();

    // olhos
    ctx.fillStyle = "#101018";
    ctx.fillRect(-4, -17, 2.5, 3);
    ctx.fillRect(2, -17, 2.5, 3);

    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawEnemy(e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    const hurt = e.hit > 0;

    // brilho ao redor
    ctx.shadowColor = e.color;
    ctx.shadowBlur = e.type === "boss" ? 26 : 12;

    if (e.type === "sai") {
      // SAIBAMEN: criatura verde
      ctx.rotate(Math.sin(e.t * 6 + e.seed) * 0.25);
      ctx.fillStyle = hurt ? "#ffffff" : "#3fbf3f";
      ctx.strokeStyle = "#14520f";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, e.r, e.r * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // garras
      ctx.strokeStyle = "#14520f";
      ctx.beginPath();
      ctx.moveTo(-e.r, 4); ctx.lineTo(-e.r - 7, 12);
      ctx.moveTo(e.r, 4); ctx.lineTo(e.r + 7, 12);
      ctx.stroke();
      // olhos vermelhos
      ctx.fillStyle = "#ff2d2d";
      ctx.beginPath();
      ctx.arc(-5, -3, 3, 0, Math.PI * 2);
      ctx.arc(5, -3, 3, 0, Math.PI * 2);
      ctx.fill();
      // boca
      ctx.strokeStyle = "#14520f";
      ctx.beginPath();
      ctx.arc(0, 5, 5, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }

    else if (e.type === "gun") {
      // SOLDADO DA FORÇA FREEZA: roxo/branco
      ctx.fillStyle = hurt ? "#ffffff" : "#9b4fd6";
      ctx.strokeStyle = "#40145f";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, e.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // capacete branco
      ctx.fillStyle = hurt ? "#dddddd" : "#efe9ff";
      ctx.beginPath();
      ctx.arc(0, -3, e.r * 0.62, 0, Math.PI * 2);
      ctx.fill();
      // olhos
      ctx.fillStyle = "#d61f1f";
      ctx.beginPath();
      ctx.arc(-4, -4, 2.6, 0, Math.PI * 2);
      ctx.arc(4, -4, 2.6, 0, Math.PI * 2);
      ctx.fill();
      // asa/ombro
      ctx.fillStyle = "#6a2ba3";
      ctx.beginPath();
      ctx.moveTo(-e.r, 2); ctx.lineTo(-e.r - 9, -6); ctx.lineTo(-e.r + 2, 10);
      ctx.moveTo(e.r, 2); ctx.lineTo(e.r + 9, -6); ctx.lineTo(e.r - 2, 10);
      ctx.fill();
    }

    else if (e.type === "boss") {
      // CELL: verde listrado com peito roxo
      ctx.fillStyle = hurt ? "#ffffff" : "#2fd67a";
      ctx.strokeStyle = "#0b3d24";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 0, e.r, e.r * 1.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // manchas pretas
      ctx.fillStyle = "#111";
      [[-24, -18, 7], [24, -16, 6], [-28, 14, 6], [28, 16, 7], [0, -34, 6]].forEach(([cx, cy, cr]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, Math.PI * 2);
        ctx.fill();
      });

      // peito roxo
      ctx.fillStyle = hurt ? "#ffffff" : "#a04fd6";
      ctx.beginPath();
      ctx.ellipse(0, 12, 24, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      // crista / chifres
      ctx.fillStyle = "#d9d2ff";
      ctx.beginPath();
      ctx.moveTo(-30, -26); ctx.lineTo(-46, -54); ctx.lineTo(-18, -38);
      ctx.moveTo(30, -26); ctx.lineTo(46, -54); ctx.lineTo(18, -38);
      ctx.moveTo(-6, -44); ctx.lineTo(0, -66); ctx.lineTo(6, -44);
      ctx.fill();

      // rosto
      ctx.fillStyle = "#e9e4ff";
      ctx.beginPath();
      ctx.ellipse(0, -14, 15, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#c11f1f";
      ctx.beginPath();
      ctx.ellipse(-6, -16, 4, 5, 0, 0, Math.PI * 2);
      ctx.ellipse(6, -16, 4, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#111";
      ctx.fillRect(-7, -4, 14, 3);
    }

    ctx.restore();

    // pequena barra de vida acima dos inimigos (não-chefão)
    if (e.type !== "boss" && e.hp < e.maxHp) {
      const w = e.r * 2;
      ctx.fillStyle = "rgba(0,0,0,.6)";
      ctx.fillRect(e.x - e.r, e.y - e.r - 10, w, 4);
      ctx.fillStyle = "#42d94a";
      ctx.fillRect(e.x - e.r, e.y - e.r - 10, w * (e.hp / e.maxHp), 4);
    }
  }

  function drawBossBar() {
    const boss = enemies.find((e) => e.type === "boss");
    if (!boss) return;
    const w = CFG.W - 60;
    ctx.fillStyle = "rgba(0,0,0,.65)";
    ctx.fillRect(30, 34, w, 16);
    ctx.strokeStyle = "#ffd21e";
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 34, w, 16);
    const g = ctx.createLinearGradient(30, 0, 30 + w, 0);
    g.addColorStop(0, "#7dff9c");
    g.addColorStop(1, "#2fd67a");
    ctx.fillStyle = g;
    ctx.fillRect(33, 37, (w - 6) * clamp(boss.hp / boss.maxHp, 0, 1), 10);
    ctx.fillStyle = "#ffd21e";
    ctx.font = "16px 'Bebas Neue', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("CELL — CHEFÃO FINAL", CFG.W / 2, 28);
  }

  function drawPowerup(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    const bob = Math.sin(p.t * 4) * 3;

    if (p.type === "senzu") {
      // feijão senzu
      ctx.shadowColor = "#42d94a";
      ctx.shadowBlur = 16;
      ctx.fillStyle = "#7ce87c";
      ctx.strokeStyle = "#14520f";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, bob, 11, 8, Math.sin(p.t * 3) * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#14520f";
      ctx.beginPath();
      ctx.arc(-3, bob - 1, 1.6, 0, Math.PI * 2);
      ctx.arc(3, bob - 1, 1.6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // esfera do dragão
      ctx.shadowColor = "#f7931e";
      ctx.shadowBlur = 20;
      const g = ctx.createRadialGradient(-4, -5 + bob, 2, 0, bob, 13);
      g.addColorStop(0, "#fff8d0");
      g.addColorStop(0.4, "#ffcc33");
      g.addColorStop(1, "#c35a00");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, bob, 13, 0, Math.PI * 2);
      ctx.fill();
      // estrelas vermelhas
      ctx.fillStyle = "#d11313";
      ctx.font = "8px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const s = p.stars;
      const spots = [[0, 0], [-5, -4], [5, -4], [-5, 4], [5, 4], [0, -7], [0, 7]];
      for (let i = 0; i < s && i < spots.length; i++) {
        ctx.fillText("★", spots[i][0], spots[i][1] + bob);
      }
    }
    ctx.restore();
  }

  function drawBeam() {
    if (state.beam <= 0) return;
    const alpha = state.beam / 0.55;
    ctx.save();
    ctx.globalAlpha = alpha;
    // feixe horizontal largo disparado pelo jogador
    const y = player.y - 10;
    const g = ctx.createLinearGradient(0, y - 40, 0, y + 40);
    g.addColorStop(0, "rgba(30,155,255,0)");
    g.addColorStop(0.5, "#ffffff");
    g.addColorStop(1, "rgba(30,155,255,0)");
    ctx.fillStyle = g;
    ctx.shadowColor = "#7de8ff";
    ctx.shadowBlur = 40;
    ctx.fillRect(0, y - 40, CFG.W, 80);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, y - 12, CFG.W, 24);
    ctx.restore();
  }

  function drawParticles() {
    particles.forEach((p) => {
      ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function drawFloaters() {
    floaters.forEach((f) => {
      ctx.globalAlpha = clamp(f.life, 0, 1);
      ctx.fillStyle = f.color;
      ctx.font = "18px 'Bebas Neue', sans-serif";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,.8)";
      ctx.shadowBlur = 4;
      ctx.fillText(f.text, f.x, f.y);
      ctx.shadowBlur = 0;
    });
    ctx.globalAlpha = 1;
  }

  /* ---------------------------------------------------------
     12. FLUXO DO JOGO (início / pausa / fim)
  --------------------------------------------------------- */
  function startGame() {
    state.mode = "playing";
    state.score = 0;
    state.wave = 0;
    state.victory = false;
    state.shake = 0;
    state.flash = 0;
    state.beam = 0;

    player.x = CFG.W / 2;
    player.y = CFG.H - 110;
    player.hp = CFG.playerMaxHp;
    player.ki = CFG.kiMax;
    player.fireCd = 0;
    player.invul = 0;
    player.tx = null;

    bullets = [];
    eBullets = [];
    enemies = [];
    powerups = [];
    particles = [];
    floaters = [];

    ui.menu.classList.add("hidden");
    ui.end.classList.add("hidden");
    ui.pause.classList.add("hidden");

    startWave(1);
    updateHud();
  }

  function togglePause() {
    if (state.mode === "playing") {
      state.mode = "paused";
      ui.pause.classList.remove("hidden");
    } else if (state.mode === "paused") {
      state.mode = "playing";
      ui.pause.classList.add("hidden");
    }
  }

  function endGame(victory) {
    state.mode = "over";
    state.victory = victory;
    keys.fire = false;

    if (state.score > state.high) {
      state.high = state.score;
      localStorage.setItem(CFG.highScoreKey, String(state.high));
    }

    ui.endTitle.textContent = victory ? "VITÓRIA!" : "DERROTA";
    ui.endTitle.classList.toggle("lose", !victory);
    ui.endText.textContent = victory
      ? "Cell foi derrotado! Você reuniu as 7 esferas do dragão e salvou o universo. 🐉"
      : "Seu ki se esgotou... Treine mais e tente novamente, guerreiro!";
    ui.endScore.textContent = `PONTOS: ${state.score}  •  RECORDE: ${state.high}`;
    ui.end.classList.remove("hidden");
    updateHud();
  }

  ui.btnStart.addEventListener("click", startGame);
  ui.btnRestart.addEventListener("click", startGame);
  ui.btnResume.addEventListener("click", togglePause);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.mode === "playing") togglePause();
  });

  /* ---------------------------------------------------------
     13. LAÇO PRINCIPAL
  --------------------------------------------------------- */
  let last = performance.now();

  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (state.mode === "playing") update(dt);
    render(dt);

    requestAnimationFrame(loop);
  }

  initStars();
  updateHud();
  requestAnimationFrame(loop);
})();
