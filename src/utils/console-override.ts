/**
 * Детальные логи в консоль только для администраторов.
 * На проде и в dev не-админы не видят console.log/warn/info/debug.
 * console.error всегда работает.
 *
 * Импортировать ПЕРВЫМ в main.tsx.
 */

const originalLog = console.log;
const originalWarn = console.warn;
const originalInfo = console.info;
const originalDebug = console.debug;

function isAdmin(): boolean {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return false;
    const user = JSON.parse(userStr) as { role?: string; isAdmin?: boolean };
    if (user.role === 'ADMIN') return true;
    if (user.isAdmin === true) return true;
    return false;
  } catch {
    return false;
  }
}

console.log = function (...args: unknown[]) {
  if (isAdmin()) originalLog.apply(console, args);
};

console.warn = function (...args: unknown[]) {
  if (isAdmin()) originalWarn.apply(console, args);
};

console.info = function (...args: unknown[]) {
  if (isAdmin()) originalInfo.apply(console, args);
};

console.debug = function (...args: unknown[]) {
  if (isAdmin()) originalDebug.apply(console, args);
};
