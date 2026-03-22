/**
 * Connection string helpers (aligned with legacy ui/src/utils/proxyConnectionString.ts).
 * Format: [protocol://]user-USERNAME[-params]:password@host:port
 *
 * Void gateway: «rotation» uses -session-RANDOM (not -rotate); -rotate is rejected with 407 for same credentials.
 * Parser still accepts legacy usernames containing -rotate.
 */

export type ProxyProtocol = 'http' | 'socks' | 'none';

export interface ParsedConnectionString {
  baseUsername: string;
  password: string;
  host: string;
  port: string;
  region?: string;
  city?: string;
  session?: string;
  ttl?: number;
  connectionType: 'sticky' | 'random' | 'rotation' | null;
  protocol?: ProxyProtocol;
}

export interface ConnectionStringParams {
  baseUsername: string;
  password: string;
  host: string;
  port: string;
  connectionType?: 'sticky' | 'random' | 'rotation' | null;
  sessionName?: string;
  region?: string;
  city?: string;
  /** TTL in minutes (1–1440), same as legacy UI */
  ttl?: number;
  protocol?: ProxyProtocol;
}

export function parseProxyConnectionString(connectionString: string): ParsedConnectionString | null {
  if (!connectionString || typeof connectionString !== 'string') {
    return null;
  }

  let rest = connectionString.trim();
  let protocol: ProxyProtocol = 'none';

  if (rest.startsWith('http://')) {
    protocol = 'http';
    rest = rest.slice(7);
  } else if (rest.startsWith('socks5://') || rest.startsWith('socks://')) {
    protocol = 'socks';
    rest = rest.slice(rest.startsWith('socks5://') ? 9 : 8);
  }

  const match = rest.match(/^([^:]+):([^@]+)@([^:]+):(\d+)$/);
  if (!match) {
    return null;
  }

  const [, username, password, host, port] = match;

  let connectionType: 'sticky' | 'random' | 'rotation' | null = null;
  let session: string | undefined;
  let region: string | undefined;
  let city: string | undefined;
  let ttl: number | undefined;

  if (username.includes('-rotate')) {
    connectionType = 'rotation';
  } else {
    const sessionMatch = username.match(/-session-([^-]+)/);
    if (sessionMatch) {
      const sessionValue = sessionMatch[1];
      if (sessionValue === 'RANDOM') {
        connectionType = 'random';
        session = 'RANDOM';
      } else {
        connectionType = 'sticky';
        session = sessionValue;
      }
    }
  }

  const regionMatch = username.match(/-region-([a-z]{2})/i);
  if (regionMatch) {
    region = regionMatch[1].toLowerCase();
  }

  const cityMatch = username.match(/-city-([^-]+)/);
  if (cityMatch) {
    city = cityMatch[1];
  }

  const ttlMatch = username.match(/-ttl-(\d+)/);
  if (ttlMatch) {
    ttl = parseInt(ttlMatch[1], 10);
  }

  let baseUsername = username
    .replace(/-rotate/g, '')
    .replace(/-session-[^-]+/g, '')
    .replace(/-region-[a-z]{2}/gi, '')
    .replace(/-city-[^-]+/g, '')
    .replace(/-ttl-\d+/g, '');

  return {
    baseUsername,
    password,
    host,
    port,
    region,
    city,
    session,
    ttl,
    connectionType,
    protocol,
  };
}

export function generateProxyConnectionString(params: ConnectionStringParams): string {
  const { baseUsername, password, host, port, connectionType, sessionName, region, city, ttl, protocol } = params;

  let username = baseUsername;
  const parts: string[] = [];

  if (region && region.trim()) {
    parts.push(`-region-${region.toLowerCase()}`);
  }

  if (city && city.trim()) {
    const cityName = city.trim().replace(/\s+/g, '_');
    parts.push(`-city-${cityName}`);
  }

  if (connectionType === 'rotation' || connectionType === 'random') {
    parts.push('-session-RANDOM');
  } else if (connectionType === 'sticky' && sessionName && sessionName.trim()) {
    const validSessionName = sessionName.trim().replace(/[^a-zA-Z0-9_]/g, '');
    if (validSessionName) {
      parts.push(`-session-${validSessionName}`);
    }
  }

  if (ttl && ttl > 0) {
    const ttlMinutes = Math.max(1, Math.min(1440, Math.floor(ttl)));
    parts.push(`-ttl-${ttlMinutes}`);
  }

  username = username + parts.join('');

  const core = `${username}:${password}@${host}:${port}`;
  if (protocol === 'http') return `http://${core}`;
  if (protocol === 'socks') return `socks5://${core}`;
  return core;
}

export function generateShortSessionId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 8);
}
