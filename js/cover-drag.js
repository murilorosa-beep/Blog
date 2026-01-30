// js/cover-drag.js
(() => {
  const wrap = document.querySelector("#article-cover-wrap");
  const img = document.querySelector("#article-cover");
  if (!wrap || !img) return;

  const params = new URLSearchParams(location.search);
  const slug = params.get("slug");
  if (!slug) {
    console.warn("[cover-drag] Sem slug na URL (?slug=...)");
    return;
  }

  let state = { x: 0, y: 0 };

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let baseX = 0;
  let baseY = 0;

  let saveTimer = null;

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function applyState() {
    img.style.objectPosition = `${50 + state.x}% ${50 + state.y}%`;
  }

  async function getClient() {
    if (window.supabaseClient) return window.supabaseClient;
    if (window.supabaseReady) return await window.supabaseReady;
    return null;
  }

  async function loadFromDb() {
    const sb = await getClient();
    if (!sb) return;

    const { data, error } = await sb
      .from("posts")
      .select("cover_pos_x, cover_pos_y")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.warn("[cover-drag] Erro ao carregar cover_pos:", error);
      return;
    }
    if (!data) return;

    const x = Number(data.cover_pos_x);
    const y = Number(data.cover_pos_y);

    if (!Number.isNaN(x)) state.x = x;
    if (!Number.isNaN(y)) state.y = y;

    applyState();
  }

  function saveToDb() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      const sb = await getClient();
      if (!sb) return;

      const payload = {
        cover_pos_x: Math.round(state.x),
        cover_pos_y: Math.round(state.y),
      };

      const { error } = await sb.from("posts").update(payload).eq("slug", slug);
      if (error) console.warn("[cover-drag] Erro ao salvar cover_pos:", error);
    }, 150);
  }

  function startDrag(clientX, clientY) {
    dragging = true;
    wrap.classList.add("is-dragging");
    startX = clientX;
    startY = clientY;
    baseX = state.x;
    baseY = state.y;
  }

  function moveDrag(clientX, clientY) {
    if (!dragging) return;

    const rect = wrap.getBoundingClientRect();
    const dxPct = ((clientX - startX) / rect.width) * 100;
    const dyPct = ((clientY - startY) / rect.height) * 100;

    state.x = clamp(baseX + dxPct, -30, 30);
    state.y = clamp(baseY + dyPct, -30, 30);

    applyState();
  }

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    wrap.classList.remove("is-dragging");
    saveToDb();
  }

  // Mouse
  wrap.addEventListener("mousedown", (e) => {
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
  });
  window.addEventListener("mousemove", (e) => moveDrag(e.clientX, e.clientY));
  window.addEventListener("mouseup", endDrag);

  // Touch
  wrap.addEventListener(
    "touchstart",
    (e) => {
      const t = e.touches[0];
      startDrag(t.clientX, t.clientY);
    },
    { passive: true }
  );

  window.addEventListener(
    "touchmove",
    (e) => {
      if (!dragging) return;
      const t = e.touches[0];
      moveDrag(t.clientX, t.clientY);
    },
    { passive: true }
  );

  window.addEventListener("touchend", endDrag);

  img.addEventListener("load", loadFromDb);
  if (img.complete) loadFromDb();
})();
