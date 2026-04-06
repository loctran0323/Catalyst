/**
 * Yahoo-style symbols: equities (e.g. BRK.B) and indices (e.g. ^GSPC).
 * Blocks empty, overlong, and weird characters used for injection / abuse.
 */
const SYMBOL_RE = /^(?:\^[A-Za-z0-9]{1,12}|[A-Za-z0-9][A-Za-z0-9.^\-]{0,14})$/;

export function isValidTickerSymbol(raw: string): boolean {
  const s = raw.trim();
  return s.length > 0 && s.length <= 16 && SYMBOL_RE.test(s);
}

export function normalizeTickerSymbol(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9.^\-]/g, "");
}
