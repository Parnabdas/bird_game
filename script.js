(() => {
  "use strict";

  // ---------- DOM refs ----------
  const angryEl   = document.getElementById("angry");
  const loveEl    = document.getElementById("lovebird");
  const gameEl    = document.getElementById("game");
  const fxLayer   = document.getElementById("fx-layer");
  const angerFill = document.getElementById("angerFill");
  const loveFill  = document.getElementById("loveFill");
  const angerNum  = document.getElementById("angerNum");
  const loveNum   = document.getElementById("loveNum");
  const timerEl   = document.getElementById("timer");
  const comboEl   = document.getElementById("combo");
  const vinePath  = document.getElementById("vinePath");
  const vineBlooms= document.getElementById("vineBlooms");
  const skyEl     = document.getElementById("sky");
  const overlay   = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlaySub   = document.getElementById("overlaySub");
  const restartBtn   = document.getElementById("restartBtn");

  // ---------- bounds (percent of #game width) ----------
  const ANGRY_MIN = 2, ANGRY_MAX = 40;
  const LOVE_MIN  = 58, LOVE_MAX  = 96;
  const MOVE_SPEED = 38; // percent per second

  const BLOOM_POSITIONS = [10, 26, 42, 58, 74, 90];
  const BLOOM_EMOJI = ["🌱","🌿","🌸","🌺","🌷","💐"];

  let state, keysDown, rafId, fireHandle, heartHandle, timerHandle, rageTimeout;

  function freshState(){
    return {
      anger: 100,
      love: 50,
      angryX: ANGRY_MIN + 4,
      loveX: LOVE_MAX - 4,
      timeLeft: 60,
      comboCount: 0,
      rageActive: false,
      running: true,
      lastFrame: null
    };
  }

  function init(){
    state = freshState();
    keysDown = new Set();
    fxLayer.innerHTML = "";
    vineBlooms.innerHTML = "";
    BLOOM_POSITIONS.forEach((pos, i) => {
      const b = document.createElement("div");
      b.className = "bloom";
      b.style.left = pos + "%";
      b.textContent = BLOOM_EMOJI[i];
      vineBlooms.appendChild(b);
    });
    vinePath.style.strokeDashoffset = "1400";
    angryEl.classList.remove("rage","hit","win-walk","kiss");
    loveEl.classList.remove("rage","hit","win-walk","kiss");
    skyEl.classList.remove("at-peace");
    angryEl.style.transition = "none";
    loveEl.style.transition = "none";
    positionBirds();
    requestAnimationFrame(() => {
      angryEl.style.transition = "";
      loveEl.style.transition = "";
    });
    updateUI();
    overlay.classList.add("hidden");

    cancelAnimationFrame(rafId);
    clearTimeout(fireHandle);
    clearTimeout(heartHandle);
    clearInterval(timerHandle);
    clearTimeout(rageTimeout);

    rafId = requestAnimationFrame(moveLoop);
    scheduleFire();
    scheduleHeart();
    timerHandle = setInterval(tickTimer, 1000);
  }

  // ---------- movement ----------
  function positionBirds(){
    angryEl.style.left = state.angryX + "%";
    loveEl.style.left = state.loveX + "%";
  }

  function moveLoop(ts){
    if (!state.running){ return; }
    if (state.lastFrame == null) state.lastFrame = ts;
    const dt = (ts - state.lastFrame) / 1000;
    state.lastFrame = ts;
    const step = MOVE_SPEED * dt;

    if (keysDown.has("angry-left"))  state.angryX -= step;
    if (keysDown.has("angry-right")) state.angryX += step;
    if (keysDown.has("love-left"))   state.loveX -= step;
    if (keysDown.has("love-right"))  state.loveX += step;

    state.angryX = Math.min(ANGRY_MAX, Math.max(ANGRY_MIN, state.angryX));
    state.loveX  = Math.min(LOVE_MAX, Math.max(LOVE_MIN, state.loveX));
    positionBirds();

    rafId = requestAnimationFrame(moveLoop);
  }

  window.addEventListener("keydown", (e) => {
    const map = { a:"angry-left", d:"angry-right", ArrowLeft:"love-left", ArrowRight:"love-right" };
    const key = map[e.key] || map[e.key.toLowerCase()];
    if (key){ keysDown.add(key); e.preventDefault(); }
  });
  window.addEventListener("keyup", (e) => {
    const map = { a:"angry-left", d:"angry-right", ArrowLeft:"love-left", ArrowRight:"love-right" };
    const key = map[e.key] || map[e.key.toLowerCase()];
    if (key){ keysDown.delete(key); }
  });

  document.querySelectorAll(".ctrl-btn").forEach(btn => {
    const dir = btn.dataset.move;
    const press = (e) => { e.preventDefault(); keysDown.add(dir); };
    const release = (e) => { e.preventDefault(); keysDown.delete(dir); };
    btn.addEventListener("mousedown", press);
    btn.addEventListener("touchstart", press, { passive:false });
    ["mouseup","mouseleave","touchend","touchcancel"].forEach(ev => btn.addEventListener(ev, release));
  });

  // ---------- shooting ----------
  function scheduleFire(){
    const interval = state.rageActive ? 700 : 1400;
    fireHandle = setTimeout(() => {
      if (state.running){ shootFire(); scheduleFire(); }
    }, interval);
  }
  function scheduleHeart(){
    heartHandle = setTimeout(() => {
      if (state.running){ shootHeart(); scheduleHeart(); }
    }, 1400);

    // small chance to trigger rage mode once things heat up
    if (!state.rageActive && state.timeLeft < 45 && Math.random() < 0.14){
      triggerRage();
    }
  }

  function makeProjectile(emoji, fromX){
    const p = document.createElement("div");
    p.className = "projectile";
    p.textContent = emoji;
    p.style.left = fromX + "%";
    gameEl.appendChild(p);
    return p;
  }

  function shootFire(){
    if (!state.running) return;
    const fromX = state.angryX + 3;
    const targetX = state.loveX; // where the love bird is right now — it may dodge
    const p = makeProjectile("🔥", fromX);
    const duration = state.rageActive ? 750 : 1100;
    requestAnimationFrame(() => {
      p.style.transition = `left ${duration}ms linear`;
      p.style.left = targetX + "%";
    });
    setTimeout(() => {
      p.remove();
      if (!state.running) return;
      const hit = Math.abs(state.loveX - targetX) < 8;
      resolveFireHit(hit, targetX);
    }, duration);
  }

  function shootHeart(){
    if (!state.running) return;
    const fromX = state.loveX - 3;
    const targetX = state.angryX;
    const p = makeProjectile("❤️", fromX);
    const duration = 1100;
    requestAnimationFrame(() => {
      p.style.transition = `left ${duration}ms linear`;
      p.style.left = targetX + "%";
    });
    setTimeout(() => {
      p.remove();
      if (!state.running) return;
      const hit = Math.abs(state.angryX - targetX) < 8;
      resolveHeartHit(hit, targetX);
    }, duration);
  }

  function resolveFireHit(hit, atX){
    if (hit){
      state.love = Math.max(0, state.love - 8);
      state.comboCount = 0; // getting hit by fire breaks any love combo
      flashBird(loveEl, "hit");
      spawnSpark(atX, "💥");
    } else {
      spawnSpark(atX, "💨");
    }
    updateUI();
    checkWin();
  }

  function resolveHeartHit(hit, atX){
    if (hit){
      state.anger = Math.max(0, state.anger - 12);
      state.love = Math.min(100, state.love + 6);
      flashBird(angryEl, "hit");
      spawnSpark(atX, "✨");
      state.comboCount += 1;
      if (state.comboCount >= 3){
        state.love = Math.min(100, state.love + 15);
        showCombo("LOVE COMBO x3! +15");
        state.comboCount = 0;
      }
    } else {
      state.comboCount = 0;
      spawnSpark(atX, "💨");
    }
    updateUI();
    checkWin();
  }

  function flashBird(el, cls){
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 350);
  }

  function spawnSpark(xPercent, emoji){
    const s = document.createElement("div");
    s.className = "spark";
    s.textContent = emoji;
    s.style.left = xPercent + "%";
    s.style.bottom = "110px";
    fxLayer.appendChild(s);
    setTimeout(() => s.remove(), 600);
  }

  function showCombo(text){
    comboEl.textContent = text;
    comboEl.classList.add("show");
    clearTimeout(showCombo._t);
    showCombo._t = setTimeout(() => comboEl.classList.remove("show"), 1400);
  }

  function triggerRage(){
    state.rageActive = true;
    angryEl.classList.add("rage");
    showCombo("😡 RAGE MODE — fire doubles!");
    rageTimeout = setTimeout(() => {
      state.rageActive = false;
      angryEl.classList.remove("rage");
    }, 5000);
  }

  // ---------- UI ----------
  function updateUI(){
    angerFill.style.width = state.anger + "%";
    loveFill.style.width = state.love + "%";
    angerNum.textContent = Math.round(state.anger);
    loveNum.textContent = Math.round(state.love);

    const progress = ((100 - state.anger) + state.love) / 200; // 0..1
    const total = 1400;
    vinePath.style.strokeDashoffset = String(total - total * progress);
    const blooms = vineBlooms.children;
    for (let i = 0; i < blooms.length; i++){
      const threshold = (i + 1) / (blooms.length + 1);
      blooms[i].classList.toggle("open", progress >= threshold);
    }
  }

  function tickTimer(){
    state.timeLeft -= 1;
    timerEl.textContent = "⏱ " + state.timeLeft;
    if (state.timeLeft <= 0){
      endGame(false);
    }
  }

  function checkWin(){
    if (state.anger <= 0 && state.love >= 100){
      endGame(true);
    }
  }

  // ---------- end game ----------
  function endGame(won){
    if (!state.running) return;
    state.running = false;
    clearTimeout(fireHandle);
    clearTimeout(heartHandle);
    clearInterval(timerHandle);
    clearTimeout(rageTimeout);
    cancelAnimationFrame(rafId);
    document.querySelectorAll(".projectile").forEach(p => p.remove());

    if (won){
      walkTogetherAndKiss();
    } else {
      showOverlay(false);
    }
  }

  function walkTogetherAndKiss(){
    angryEl.classList.add("win-walk");
    loveEl.classList.add("win-walk");
    angryEl.style.left = "46%";
    loveEl.style.left = "54%";
    setTimeout(() => {
      angryEl.classList.add("kiss");
      loveEl.classList.add("kiss");
      angryEl.querySelector(".bird-emoji").textContent = "😍";
      spawnConfetti();
      skyEl.classList.add("at-peace");
      showOverlay(true);
    }, 1650);
  }

  function spawnConfetti(){
    const emojis = ["❤️","💖","💕","💗","🌸"];
    for (let i = 0; i < 28; i++){
      const h = document.createElement("div");
      h.className = "confetti-heart";
      h.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      h.style.left = (10 + Math.random() * 80) + "%";
      h.style.animationDuration = (2 + Math.random() * 1.6) + "s";
      h.style.animationDelay = (Math.random() * 0.6) + "s";
      fxLayer.appendChild(h);
      setTimeout(() => h.remove(), 4200);
    }
  }

  function showOverlay(won){
    overlayTitle.textContent = won ? "💋 LOVE WINS ❤️" : "GAME OVER";
    overlaySub.textContent = won
      ? `They found peace with ${state.timeLeft} second${state.timeLeft === 1 ? "" : "s"} left on the clock.`
      : "Both birds are still ruffled. Land more hearts, dodge the fire, and try again.";
    overlay.classList.remove("hidden");
  }

  restartBtn.addEventListener("click", init);

  init();
})();
