// js/admin-config.js
console.log("[admin-config] carregado");

window.ADMIN_EMAILS = ["murilogabrielm0@gmail.com"];

window.isAdminEmail = function (email) {
  return (
    typeof email === "string" &&
    window.ADMIN_EMAILS.includes(email.toLowerCase().trim())
  );
};
