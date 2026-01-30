// js/theme-toggle.js
(() => {
  const root = document.documentElement;
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;

  const KEY = "archflow_theme";

  function apply(theme) {
    root.setAttribute("data-theme", theme);
    const isLight = theme === "light";
    btn.setAttribute("aria-pressed", String(isLight));
    btn.title = isLight ? "Ativar tema escuro" : "Ativar tema claro";
  }

  function getInitialTheme() {
    const saved = localStorage.getItem(KEY);
    if (saved === "light" || saved === "dark") return saved;

    // Se nunca salvou, respeita o sistema
    const prefersLight = window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: light)").matches;

    return prefersLight ? "light" : "dark";
  }

  // Inicial
  apply(getInitialTheme());

  // Clique
  btn.addEventListener("click", () => {
    const current = root.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    apply(next);
    localStorage.setItem(KEY, next);
  });
})();
