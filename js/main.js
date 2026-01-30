// js/main.js
const FALLBACKS_BY_CATEGORY = {
  cloud: "images/covers/cloud.png",
  linux: "images/covers/linux.png",
  servidores: "images/covers/servidores.png",
  redes: "images/covers/redes.png",
  seguranca: "images/covers/seguranca.png",
  ia: "images/covers/ia.png",
  labs: "images/covers/labs.png",
  geral: "images/artigo1.png",
};

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDateBR(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR");
}

function estimateReadTimeFromHtml(html = "") {
  const text = String(html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = text ? text.split(" ").length : 0;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min`;
}

function categoryKey(category = "") {
  const c = String(category ?? "").toLowerCase();
  if (c.includes("cloud")) return "cloud";
  if (c.includes("linux")) return "linux";
  if (c.includes("serv")) return "servidores";
  if (c.includes("rede")) return "redes";
  if (c.includes("seg")) return "seguranca";
  if (c.includes("ia")) return "ia";
  if (c.includes("lab")) return "labs";
  return "geral";
}

function normalizeCover(cover_url, category) {
  const raw = String(cover_url || "").trim();
  if (raw) return raw;
  const key = categoryKey(category);
  return FALLBACKS_BY_CATEGORY[key] || FALLBACKS_BY_CATEGORY.geral;
}

function badgeClass(category = "") {
  const c = String(category ?? "").toLowerCase();
  if (c.includes("linux")) return "badge-orange";
  if (c.includes("seg")) return "badge-red";
  if (c.includes("rede")) return "badge-blue";
  if (c.includes("cloud")) return "badge-green";
  if (c.includes("ia")) return "badge-yellow";
  if (c.includes("serv")) return "badge-purple";
  if (c.includes("lab")) return "badge-purple";
  return "badge-purple";
}

function renderCard(post) {
  const title = escapeHtml(post?.title ?? "Sem título");
  const slugRaw = String(post?.slug ?? "").trim();
  const slug = encodeURIComponent(slugRaw);
  const category = escapeHtml(post?.category ?? "Geral");
  const excerpt = escapeHtml(post?.excerpt ?? "");
  const cover = escapeHtml(normalizeCover(post?.cover_url, post?.category));
  const coverFallback = escapeHtml(
    FALLBACKS_BY_CATEGORY[categoryKey(post?.category)] || FALLBACKS_BY_CATEGORY.geral
  );

  const date = formatDateBR(post?.created_at);
  const read = estimateReadTimeFromHtml(post?.content_html ?? "");
  const href = slugRaw ? `artigo.html?slug=${slug}` : "artigos.html";

  return `
    <article class="article-card" role="listitem">
      <a class="article-link" href="${href}" aria-label="Ler: ${title}">
        <img
          src="${cover}"
          data-fallback="${coverFallback}"
          alt="${title}"
          loading="lazy"
          decoding="async"
        />
        <div class="article-body">
          <span class="badge ${badgeClass(post?.category)}">${category}</span>
          <h3>${title}</h3>
          <p>${excerpt || "Leia o artigo completo."}</p>
          <div class="article-meta">
            <span>${date || "—"}</span>
            <span>${read}</span>
            <span class="arrow" aria-hidden="true">→</span>
          </div>
        </div>
      </a>
    </article>
  `;
}

function applyImgFallbacks(root = document) {
  root.querySelectorAll("img[data-fallback]").forEach((img) => {
    img.addEventListener(
      "error",
      () => {
        const fb = img.getAttribute("data-fallback");
        if (fb && img.src !== fb) img.src = fb;
      },
      { once: true }
    );
  });
}

/* =========================================================
   ✅ NOVO: Home - busca e chips clicáveis
   ========================================================= */
function wireHomeSearchAndChips() {
  const form = document.getElementById("home-search");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = String(form.querySelector("input[name='q']")?.value || "").trim();
      const url = new URL("artigos.html", window.location.href);
      if (q) url.searchParams.set("q", q);
      window.location.href = url.toString();
    });
  }

  document.querySelectorAll(".tags-clickable .tag[data-tag]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tag = btn.getAttribute("data-tag");
      const url = new URL("artigos.html", window.location.href);
      if (tag) url.searchParams.set("tag", tag);
      window.location.href = url.toString();
    });
  });
}

/* =========================================================
   ✅ NOVO: Painel - estado do site
   ========================================================= */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

async function loadSiteStats() {
  if (!document.getElementById("stat-posts")) return;

  if (!window.supabaseClient) {
    setText("site-status-pill", "offline");
    setText("stat-posts", "—");
    setText("stat-published", "—");
    setText("stat-last", "—");
    return;
  }

  try {
    const { data, error } = await window.supabaseClient
      .from("posts")
      .select("created_at,published", { count: "exact" })
      .order("created_at", { ascending: false });

    if (error) throw error;

    const total = Array.isArray(data) ? data.length : 0;
    const published = Array.isArray(data) ? data.filter((p) => p?.published).length : 0;
    const last = Array.isArray(data) && data[0]?.created_at ? formatDateBR(data[0].created_at) : "—";

    setText("site-status-pill", "online");
    setText("stat-posts", String(total));
    setText("stat-published", String(published));
    setText("stat-last", last || "—");
  } catch (err) {
    console.error("[stats] erro:", err);
    setText("site-status-pill", "instável");
    setText("stat-posts", "—");
    setText("stat-published", "—");
    setText("stat-last", "—");
  }
}

async function loadFeatured() {
  const container = document.getElementById("featured-posts");
  if (!container) return;

  if (!window.supabaseClient) {
    container.innerHTML = `<p style="color:rgba(229,231,235,0.7)">Supabase não inicializou. Confira a ordem dos scripts.</p>`;
    return;
  }

  try {
    const { data, error } = await window.supabaseClient
      .from("posts")
      .select("id,title,slug,cover_url,category,excerpt,content_html,created_at,published")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(3);

    if (error) throw error;

    if (!data || data.length === 0) {
      container.innerHTML = `
        <p style="color:rgba(229,231,235,0.7)">
          Nenhum artigo publicado ainda. Crie um post e marque <strong>published = true</strong>.
        </p>
      `;
      return;
    }

    container.innerHTML = data.map(renderCard).join("");
    applyImgFallbacks(container);
  } catch (err) {
    console.error("[main] erro:", err);
    container.innerHTML = `<p style="color:rgba(229,231,235,0.7)">Falha ao carregar. Veja o Console.</p>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  wireHomeSearchAndChips();
  loadSiteStats();
  loadFeatured();
});
