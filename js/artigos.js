// js/artigos.js
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

function categoryIconSvg(category = "") {
  const c = String(category ?? "").toLowerCase();

  if (c.includes("cloud")) return `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7.5 18h10a4 4 0 0 0 .7-7.94A5.5 5.5 0 0 0 7.38 9.5 3.5 3.5 0 0 0 7.5 18Z"
        stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
    </svg>`;

  if (c.includes("linux")) return `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6h16v12H4V6Z" stroke="currentColor" stroke-width="2"/>
      <path d="M7 10l3 2-3 2" stroke="currentColor" stroke-width="2"/>
      <path d="M12 14h5" stroke="currentColor" stroke-width="2"/>
    </svg>`;

  if (c.includes("serv")) return `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6h16v5H4V6Zm0 7h16v5H4v-5Z" stroke="currentColor" stroke-width="2"/>
      <path d="M7 8h.01M7 15h.01" stroke="currentColor" stroke-width="3"/>
    </svg>`;

  if (c.includes("rede")) return `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 7h4v4H7V7Zm6 6h4v4h-4v-4Z" stroke="currentColor" stroke-width="2"/>
      <path d="M11 9h2a3 3 0 0 1 3 3v1" stroke="currentColor" stroke-width="2"/>
      <path d="M9 11v2a3 3 0 0 0 3 3h1" stroke="currentColor" stroke-width="2"/>
    </svg>`;

  if (c.includes("seg")) return `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 19 6v6c0 5-3 9-7 9s-7-4-7-9V6l7-3Z"
        stroke="currentColor" stroke-width="2"/>
    </svg>`;

  if (c.includes("ia")) return `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0 0 6v3a3 3 0 0 0 3 3"
        stroke="currentColor" stroke-width="2"/>
      <path d="M15 4a3 3 0 0 1 3 3v1a3 3 0 0 1 0 6v3a3 3 0 0 1-3 3"
        stroke="currentColor" stroke-width="2"/>
      <path d="M10 8h4M10 12h4M10 16h4" stroke="currentColor" stroke-width="2"/>
    </svg>`;

  if (c.includes("lab")) return `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10 3v6l-5 9a3 3 0 0 0 2.6 4.5h8.8A3 3 0 0 0 19 18l-5-9V3"
        stroke="currentColor" stroke-width="2"/>
      <path d="M9 9h6" stroke="currentColor" stroke-width="2"/>
    </svg>`;

  return `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12h16" stroke="currentColor" stroke-width="2"/>
      <path d="M12 4v16" stroke="currentColor" stroke-width="2"/>
    </svg>`;
}

function renderCard(post) {
  const title = escapeHtml(post?.title ?? "Sem título");
  const slugRaw = String(post?.slug ?? "").trim();
  const slug = encodeURIComponent(slugRaw);
  const category = escapeHtml(post?.category ?? "Geral");
  const excerpt = escapeHtml(post?.excerpt ?? "");
  const cover = escapeHtml(normalizeCover(post?.cover_url, post?.category));
  const coverFallback = escapeHtml(FALLBACKS_BY_CATEGORY[categoryKey(post?.category)] || FALLBACKS_BY_CATEGORY.geral);

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
          <span class="badge ${badgeClass(post?.category)}">
            ${categoryIconSvg(post?.category)}
            ${category}
          </span>
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

/* =========================
   ✅ filtros via URL
   ========================= */
function getFiltersFromUrl() {
  const p = new URLSearchParams(window.location.search);
  const q = (p.get("q") || "").trim();
  const tag = (p.get("tag") || "").trim();
  const trail = (p.get("trail") || "").trim();
  const tool = (p.get("tool") || "").trim();
  return { q, tag, trail, tool };
}

function setResultsNote(text) {
  const el = document.getElementById("results-note");
  if (el) el.textContent = text || "";
}

function setClearVisible(isVisible) {
  const wrap = document.getElementById("clear-wrap");
  if (wrap) wrap.style.display = isVisible ? "flex" : "none";
}

function trailToCategories(trail = "") {
  const t = String(trail || "").toLowerCase();
  if (t === "comece") return ["Geral", "Linux", "Redes"];
  if (t === "hardening") return ["Segurança", "Linux"];
  if (t === "segmentacao") return ["Redes", "Segurança"];
  if (t === "observabilidade") return ["Labs", "Servidores", "Linux"];
  return [];
}

function toolToHint(tool = "") {
  const t = String(tool || "").toLowerCase();
  if (t === "checklists") return ["checklist", "check-list"];
  if (t === "comandos") return ["comando", "cmd", "bash", "linux"];
  if (t === "templates") return ["template", "modelo"];
  if (t === "snippets") return ["snippet", "trecho", "config"];
  return [];
}

async function loadAllPosts() {
  const grid = document.getElementById("posts-grid");
  if (!grid) return;

  const { q, tag, trail, tool } = getFiltersFromUrl();
  const hasFilter = !!(q || tag || trail || tool);
  setClearVisible(hasFilter);

  if (!window.supabaseClient) {
    grid.innerHTML = `<p style="color:rgba(229,231,235,0.7)">Supabase não inicializou. Confira a ordem dos scripts.</p>`;
    setResultsNote("");
    return;
  }

  try {
    let query = window.supabaseClient
      .from("posts")
      .select("id,title,slug,cover_url,category,excerpt,content_html,created_at,published")
      .eq("published", true)
      .order("created_at", { ascending: false });

    // busca no banco (título/excerpt)
    if (q) {
      const safe = q.replaceAll("%", "").replaceAll(",", " ");
      query = query.or(`title.ilike.%${safe}%,excerpt.ilike.%${safe}%`);
    }

    // tag/categoria no banco (simples e rápido)
    if (tag) {
      const safeTag = tag.replaceAll("%", "");
      query = query.ilike("category", `%${safeTag}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    let posts = Array.isArray(data) ? data : [];

    // trail/tool: refinamento local (pra não complicar query)
    if (trail) {
      const cats = trailToCategories(trail);
      if (cats.length) {
        posts = posts.filter((p) => cats.some((c) => String(p?.category || "").toLowerCase().includes(String(c).toLowerCase())));
      }
    }

    if (tool) {
      const hints = toolToHint(tool);
      if (hints.length) {
        posts = posts.filter((p) => {
          const blob = `${p?.title || ""} ${p?.excerpt || ""} ${p?.content_html || ""}`.toLowerCase();
          return hints.some((h) => blob.includes(h));
        });
      }
    }

    if (!posts.length) {
      grid.innerHTML = `<p style="color:rgba(229,231,235,0.7)">Nenhum resultado encontrado.</p>`;
      const label = [
        q ? `busca: "${q}"` : "",
        tag ? `tag: "${tag}"` : "",
        trail ? `trilha: "${trail}"` : "",
        tool ? `tool: "${tool}"` : "",
      ].filter(Boolean).join(" • ");
      setResultsNote(label ? `Sem resultados para ${label}.` : "");
      return;
    }

    grid.innerHTML = posts.map(renderCard).join("");
    applyImgFallbacks(grid);

    const label = [
      q ? `busca: "${q}"` : "",
      tag ? `tag: "${tag}"` : "",
      trail ? `trilha: "${trail}"` : "",
      tool ? `tool: "${tool}"` : "",
    ].filter(Boolean).join(" • ");

    setResultsNote(label ? `${posts.length} resultado(s) • ${label}` : `${posts.length} artigo(s) publicado(s).`);
  } catch (err) {
    console.error("[artigos] erro:", err);
    grid.innerHTML = `<p style="color:rgba(229,231,235,0.7)">Falha ao carregar. Veja o Console.</p>`;
    setResultsNote("");
  }
}

document.addEventListener("DOMContentLoaded", loadAllPosts);
