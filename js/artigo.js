// arquivo: js/artigo.js
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

function getSlugFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("slug")?.trim() || "";
}

function renderMeta({ category, created_at, content_html }) {
  const meta = document.getElementById("article-meta");
  if (!meta) return;

  const cat = escapeHtml(category ?? "Geral");
  const date = formatDateBR(created_at) || "—";
  const read = estimateReadTimeFromHtml(content_html ?? "");

  meta.innerHTML = `
    <span class="tag">${cat}</span>
    <span class="tag">${date}</span>
    <span class="tag">${read}</span>
  `;
}

function applyCover({ cover_url, category, title }) {
  const wrap = document.getElementById("article-cover-wrap");
  const img = document.getElementById("article-cover");
  if (!wrap || !img) return;

  const src = normalizeCover(cover_url, category);
  if (!src) return;

  wrap.style.display = "block";
  img.src = src;
  img.alt = title ? String(title) : "Capa do artigo";

  img.addEventListener(
    "error",
    () => {
      const fb =
        FALLBACKS_BY_CATEGORY[categoryKey(category)] ||
        FALLBACKS_BY_CATEGORY.geral;
      if (fb && img.src !== fb) img.src = fb;
    },
    { once: true }
  );
}

/* =========================
   ✅ SUMÁRIO LATERAL (TOC)
   ========================= */
function slugifyLite(s = "") {
  return String(s)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function initArticleToc() {
  const content = document.getElementById("article-content");
  const toc = document.getElementById("article-toc");
  if (!content || !toc) return;

  const headings = Array.from(content.querySelectorAll("h2, h3"));
  if (!headings.length) {
    toc.innerHTML = `<span style="color:rgba(229,231,235,0.6);font-size:13px">Sem sumário.</span>`;
    return;
  }

  const used = new Set();
  headings.forEach((h) => {
    const level = h.tagName === "H2" ? 2 : 3;
    const text = (h.textContent || "").trim();
    if (!text) return;

    if (!h.id) {
      let base = slugifyLite(text) || `sec-${level}`;
      let id = base;
      let i = 2;
      while (used.has(id) || document.getElementById(id)) {
        id = `${base}-${i++}`;
      }
      h.id = id;
    }
    used.add(h.id);
  });

  toc.innerHTML = headings
    .map((h) => {
      const text = (h.textContent || "").trim();
      if (!text || !h.id) return "";
      const level = h.tagName === "H2" ? 2 : 3;
      return `<a href="#${encodeURIComponent(h.id)}" data-id="${h.id}" data-level="${level}">${escapeHtml(text)}</a>`;
    })
    .filter(Boolean)
    .join("");

  // scroll suave com compensação do header
  toc.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const id = a.getAttribute("data-id");
      const el = id ? document.getElementById(id) : null;
      if (!el) return;

      const headerOffset = 86; // ajuste se seu header mudar
      const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top, behavior: "smooth" });

      history.replaceState(null, "", `#${id}`);
    });
  });

  const links = Array.from(toc.querySelectorAll("a[data-id]"));
  const linkById = new Map(links.map((a) => [a.getAttribute("data-id"), a]));

  const setActive = (id) => {
    links.forEach((a) =>
      a.classList.toggle("is-active", a.getAttribute("data-id") === id)
    );
  };

  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;
      const id = visible.target.id;
      if (id && linkById.has(id)) setActive(id);
    },
    {
      root: null,
      rootMargin: "-92px 0px -70% 0px",
      threshold: [0.05, 0.15, 0.3, 0.6, 1],
    }
  );

  headings.forEach((h) => io.observe(h));

  const initial = (location.hash || "").replace("#", "");
  if (initial && document.getElementById(initial)) setActive(initial);
  else if (headings[0]?.id) setActive(headings[0].id);
}

/* =========================
   ✅ LOAD DO ARTIGO
   ========================= */
async function loadArticle() {
  const titleEl = document.getElementById("article-title");
  const contentEl = document.getElementById("article-content");
  const slug = getSlugFromUrl();

  if (!slug) {
    if (titleEl) titleEl.textContent = "Artigo não encontrado";
    if (contentEl)
      contentEl.innerHTML = `<p style="color:rgba(229,231,235,0.7)">Faltou o parâmetro <strong>slug</strong> na URL.</p>`;
    return;
  }

  if (!window.supabaseClient) {
    if (titleEl) titleEl.textContent = "Erro";
    if (contentEl)
      contentEl.innerHTML = `<p style="color:rgba(229,231,235,0.7)">Supabase não inicializou. Confira a ordem dos scripts.</p>`;
    return;
  }

  try {
    const { data, error } = await window.supabaseClient
      .from("posts")
      .select("title, slug, category, cover_url, content_html, created_at, published")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      if (titleEl) titleEl.textContent = "Artigo não encontrado";
      if (contentEl)
        contentEl.innerHTML = `<p style="color:rgba(229,231,235,0.7)">Esse artigo não existe ou não está publicado.</p>`;
      return;
    }

    if (titleEl) titleEl.textContent = data.title ?? "Sem título";
    renderMeta(data);
    applyCover({ cover_url: data.cover_url, category: data.category, title: data.title });

    if (contentEl)
      contentEl.innerHTML =
        data.content_html ||
        `<p style="color:rgba(229,231,235,0.7)">Sem conteúdo.</p>`;

    // ✅ monta o sumário depois do HTML entrar
    initArticleToc();
  } catch (err) {
    console.error("[artigo] erro:", err);
    if (titleEl) titleEl.textContent = "Falha ao carregar";
    if (contentEl)
      contentEl.innerHTML = `<p style="color:rgba(229,231,235,0.7)">Erro ao buscar no Supabase. Veja o Console.</p>`;
  }
}

document.addEventListener("DOMContentLoaded", loadArticle);
