// js/admin.js
(() => {
  const $ = (s) => document.querySelector(s);

  const app = $("#app-card");
  const msg = $("#global-msg");
  const list = $("#posts-list");
  const search = $("#search");

  const title = $("#title");
  const slug = $("#slug");
  const category = $("#category");
  const excerpt = $("#excerpt");          // ✅ coluna excerpt
  const cover = $("#cover-url");          // ✅ coluna cover_url
  const content = $("#content-html");
  const published = $("#published");

  const coverFile = $("#cover-file");
  const btnUploadCover = $("#btn-upload-cover");

  const previewBox = $("#preview-box");
  const btnPreview = $("#btn-preview");

  const btnNew = $("#btn-new");
  const btnDelete = $("#btn-delete");
  const btnLogout = $("#btn-logout");

  let sb;
  let currentId = null;
  let allPosts = [];

  function setMsg(text = "", ok = false) {
    msg.textContent = text;
    msg.style.color = ok ? "#86efac" : "#fca5a5";
  }

  function escapeHtml(str = "") {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function slugify(input = "") {
    return String(input)
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function safeName(name = "imagem") {
    return String(name)
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9.\-_]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function waitSB() {
    for (let i = 0; i < 60; i++) {
      if (window.supabaseClient) return window.supabaseClient;
      await new Promise((r) => setTimeout(r, 50));
    }
    return null;
  }

  async function guard() {
    sb = await waitSB();
    if (!sb) return location.replace("login.html");

    const { data } = await sb.auth.getSession();
    const email = data?.session?.user?.email;

    if (!email || !window.isAdminEmail?.(email)) {
      await sb.auth.signOut();
      location.replace("login.html");
      return false;
    }

    $("#user-line").textContent = email;

    app.style.display = "grid";
    btnLogout.style.display = "inline-flex";
    return true;
  }

  // auto-slug (só se slug estiver vazio)
  title.addEventListener("input", () => {
    if (!slug.value.trim()) slug.value = slugify(title.value);
  });

  /* =========================
     STORAGE: UPLOAD CAPA
     ========================= */
  async function uploadCoverToStorage(file) {
    const BUCKET = "covers"; // ✅ seu bucket

    const ts = Date.now();
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const base = safeName(file.name.replace(/\.[^/.]+$/, "")) || "cover";
    const path = `posts/${ts}-${base}.${ext}`;

    const up = await sb.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || "image/jpeg",
    });

    if (up.error) throw up.error;

    const pub = sb.storage.from(BUCKET).getPublicUrl(path);
    return pub?.data?.publicUrl || null;
  }

  btnUploadCover?.addEventListener("click", async () => {
    try {
      const file = coverFile?.files?.[0];
      if (!file) return setMsg("Selecione uma imagem primeiro.", false);

      setMsg("Enviando imagem...", true);

      const url = await uploadCoverToStorage(file);
      if (!url) return setMsg("Não consegui obter a URL pública.", false);

      cover.value = url;
      setMsg("Imagem enviada ✅ URL preenchida.", true);
      renderPreview();
    } catch (err) {
      console.error(err);
      setMsg(`Erro ao enviar imagem: ${err?.message || "ver console"}`, false);
    }
  });

  /* =========================
     LISTA + BUSCA
     ========================= */
  function renderList(items) {
    list.innerHTML = "";

    items.forEach((p) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "admin-item";
      item.innerHTML = `
        <strong>${escapeHtml(p.title || "Sem título")}</strong>
        <div class="admin-sub">
          <span>${p.published ? "Publicado" : "Rascunho"}</span>
        </div>
      `;

      item.onclick = () => {
        document.querySelectorAll(".admin-item").forEach((i) => i.classList.remove("active"));
        item.classList.add("active");
        openPost(p.id);
      };

      list.appendChild(item);
    });

    if (!items.length) {
      list.innerHTML = `<div class="muted" style="padding:12px;opacity:.8">Nenhum artigo encontrado.</div>`;
    }
  }

  async function loadPosts() {
    const { data, error } = await sb
      .from("posts")
      .select("id,title,published,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setMsg(`Erro ao carregar artigos: ${error.message || "ver console"}`);
      return;
    }

    allPosts = data || [];
    renderList(allPosts);
  }

  search?.addEventListener("input", () => {
    const q = (search.value || "").toLowerCase().trim();
    if (!q) return renderList(allPosts);

    const filtered = allPosts.filter((p) =>
      String(p.title || "").toLowerCase().includes(q)
    );
    renderList(filtered);
  });

  /* =========================
     ABRIR POST (colunas reais)
     ========================= */
  async function openPost(id) {
    const { data, error } = await sb
      .from("posts")
      .select("id,title,slug,cover_url,category,excerpt,content_html,published,created_at,published_at,cover_pos_x,cover_pos_y")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      setMsg(`Erro ao abrir artigo: ${error.message || "ver console"}`);
      return;
    }

    currentId = data.id;

    title.value = data.title || "";
    slug.value = data.slug || "";
    category.value = data.category || "Linux";
    excerpt.value = data.excerpt || "";
    cover.value = data.cover_url || "";
    content.value = data.content_html || "";
    published.checked = !!data.published;

    renderPreview();
    setMsg("", true);
  }

  /* =========================
     PREVIEW
     ========================= */
  function renderPreview() {
    previewBox.innerHTML =
      content.value?.trim() || "<em style='opacity:.6'>Nada para visualizar</em>";
  }

  btnPreview.onclick = renderPreview;
  content.addEventListener("input", renderPreview);

  /* =========================
     SALVAR (inclui published_at)
     ========================= */
  async function save(e) {
    e.preventDefault();

    const now = new Date().toISOString();
    const isPub = !!published.checked;

    const payload = {
      title: title.value?.trim() || "Sem título",
      slug: (slug.value?.trim() || slugify(title.value || "")),
      category: category.value || "Linux",
      excerpt: excerpt.value || "",          // ✅
      cover_url: cover.value || "",          // ✅
      content_html: content.value || "",
      published: isPub,
      published_at: isPub ? now : null,      // ✅ zera quando despublica
    };

    const res = currentId
      ? await sb.from("posts").update(payload).eq("id", currentId).select()
      : await sb.from("posts").insert(payload).select();

    if (res.error) {
      console.error(res.error);
      setMsg(`Erro ao salvar: ${res.error.message || "ver console"}`);
      return;
    }

    // se criou agora, pega o id
    if (!currentId && res.data && res.data[0]?.id) {
      currentId = res.data[0].id;
    }

    setMsg("Salvo com sucesso ✅", true);
    await loadPosts();
  }

  /* =========================
     NOVO / EXCLUIR / LOGOUT
     ========================= */
  btnNew.onclick = () => {
    currentId = null;
    title.value = "";
    slug.value = "";
    category.value = "Linux";
    excerpt.value = "";
    cover.value = "";
    content.value = "";
    published.checked = false;

    if (coverFile) coverFile.value = "";

    renderPreview();
    document.querySelectorAll(".admin-item").forEach((i) => i.classList.remove("active"));
    setMsg("Novo artigo pronto.", true);
  };

  btnDelete.onclick = async () => {
    if (!currentId) return setMsg("Nenhum artigo selecionado.", false);
    if (!confirm("Excluir este artigo?")) return;

    const del = await sb.from("posts").delete().eq("id", currentId);
    if (del.error) {
      console.error(del.error);
      return setMsg(`Erro ao excluir: ${del.error.message || "ver console"}`, false);
    }

    btnNew.onclick();
    await loadPosts();
    setMsg("Excluído ✅", true);
  };

  btnLogout.onclick = async () => {
    await sb.auth.signOut();
    location.replace("login.html");
  };

  /* =========================
     INIT
     ========================= */
  document.addEventListener("DOMContentLoaded", async () => {
    if (!(await guard())) return;
    $("#post-form").addEventListener("submit", save);
    await loadPosts();
    renderPreview();
  });
})();
