// js/admin-guard.js
(() => {
  const guard = document.getElementById("admin-guard");
  const app = document.getElementById("admin-app");

  const ADMIN_EMAILS = ["murilogabrielm@gmail.com"].map((e) =>
    String(e).toLowerCase().trim()
  );

  function setGuardText(text) {
    if (!guard) return;
    const sub = guard.querySelector(".guard-sub");
    if (sub) sub.textContent = text || "Aguarde…";
  }

  function showApp() {
    if (guard) guard.style.display = "none";
    if (app) app.hidden = false;

    // Sinaliza para o admin.js que o guard terminou
    window.dispatchEvent(new CustomEvent("archflow:guard-ready"));
  }

  function denyToHome() {
    console.warn("[admin-guard] Usuário logado mas não autorizado → home");
    location.replace("index.html");
  }

  async function check() {
    setGuardText("Conectando…");

    const sb = await (window.__supabaseReady || Promise.resolve(window.supabaseClient)).catch(() => null);

    if (!sb) {
      console.warn("[admin-guard] Supabase não inicializou");
      // Mesmo assim, libera o app para mostrar erro / tela de login
      showApp();
      return;
    }

    try {
      setGuardText("Checando sessão…");
      const { data, error } = await sb.auth.getSession();
      if (error) {
        console.warn("[admin-guard] getSession error:", error);
        showApp();
        return;
      }

      const session = data?.session;

      // Sem sessão → libera app e deixa o admin.js mostrar login
      if (!session?.user) {
        console.log("[admin-guard] Sem sessão ativa");
        showApp();
        return;
      }

      const email = String(session.user.email || "").toLowerCase().trim();
      console.log("[admin-guard] Sessão:", email);

      // Sessão existe, mas não é admin → home
      if (!ADMIN_EMAILS.includes(email)) {
        denyToHome();
        return;
      }

      // Admin ok
      console.log("[admin-guard] Admin autorizado");
      showApp();
    } catch (e) {
      console.error("[admin-guard] erro crítico:", e);
      showApp();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", check);
  } else {
    check();
  }
})();
