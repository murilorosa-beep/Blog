// js/login.js
(() => {
  const $ = (s) => document.querySelector(s);
  const form = $("#login-form");
  const msg = $("#msg");

  function setMsg(text, ok = false) {
    msg.textContent = text || "";
    msg.style.color = ok ? "#86efac" : "#fca5a5";
  }

  async function waitSB() {
    for (let i = 0; i < 40; i++) {
      if (window.supabaseClient) return window.supabaseClient;
      await new Promise(r => setTimeout(r, 50));
    }
    return null;
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const sb = await waitSB();
    if (!sb) return setMsg("Supabase não inicializou");

    const { data } = await sb.auth.getSession();
    const email = data?.session?.user?.email;
    if (email && window.isAdminEmail(email)) {
      location.replace("admin.html");
    }
  });

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const sb = await waitSB();
    if (!sb) return setMsg("Supabase não inicializou");

    const email = $("#email").value.trim();
    const password = $("#pass").value;

    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return setMsg(error.message);

    if (!window.isAdminEmail(data.user.email)) {
      await sb.auth.signOut();
      return setMsg("Acesso restrito ao administrador");
    }

    location.replace("admin.html");
  });
})();
