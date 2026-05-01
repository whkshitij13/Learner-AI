export const ADMIN_EMAIL = "kshitij.admin@gmail.com";

export function isAdminEmail(email = "") {
  return String(email).trim().toLowerCase() === ADMIN_EMAIL;
}
