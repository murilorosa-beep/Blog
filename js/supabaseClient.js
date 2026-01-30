// js/supabaseClient.js
(function () {
  const SUPABASE_URL = "https://zqoqggzvflcwkqvlujyh.supabase.co";
  const SUPABASE_KEY = "sb_publishable_GthqePKruEk9V-cGsUqbSQ_wLfmNdHe";

  // já existe
  if (window.supabaseClient) return;

  // SDK precisa existir
  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error(
      "[Supabase] SDK não carregou. Garanta que o CDN @supabase/supabase-js@2 venha antes de js/supabaseClient.js"
    );
    return;
  }

  // saneamento
  const url = String(SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const key = String(SUPABASE_KEY || "").trim();

  if (!/^https:\/\/.+\.supabase\.co$/i.test(url)) {
    console.error("[Supabase] SUPABASE_URL inválida:", url);
    return;
  }
  if (!key) {
    console.error("[Supabase] SUPABASE_KEY vazia");
    return;
  }

  try {
    window.supabaseClient = window.supabase.createClient(url, key, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      global: {
        // ajuda em ambientes com rede ruim (timeouts menores)
        fetch: (input, init) => fetch(input, { ...init }),
      },
    });

    console.log("[Supabase] client ok:", url);
  } catch (err) {
    console.error("[Supabase] falha ao criar client:", err);
  }
})();
