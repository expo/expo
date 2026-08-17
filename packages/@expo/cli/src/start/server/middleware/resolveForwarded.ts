import type { ServerRequest } from './server.types';

/** How a client reached this dev server, as reported by the request itself */
export interface ForwardedRequestInfo {
  authority: string | undefined;
  protocol: 'http' | 'https' | undefined;
  /**
   * Whether the authority was reported via the RFC 7239 `Forwarded` header rather than the
   * `X-Forwarded-Host` header. Expo clients send `Forwarded` themselves and resolve relative
   * manifest URLs, while proxies typically only add `X-Forwarded-*` headers for clients that may
   * not support relative URLs.
   */
  viaForwardedHeader: boolean;
}

function splitOutsideQuotes(value: string, separator: string): string[] {
  const parts: string[] = [];
  let start = 0;
  let isQuoted = false;
  for (let index = 0; index < value.length; index++) {
    const char = value[index];
    if (char === '"' && value[index - 1] !== '\\') {
      isQuoted = !isQuoted;
    } else if (char === separator && !isQuoted) {
      parts.push(value.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(value.slice(start));
  return parts;
}

function unquote(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/\\(.)/g, '$1');
  }
  return trimmed;
}

function parseForwardedHeader(header: string): Record<string, string> {
  const params: Record<string, string> = {};
  const firstElement = splitOutsideQuotes(header, ',')[0] ?? '';
  for (const pair of splitOutsideQuotes(firstElement, ';')) {
    const separatorIndex = pair.indexOf('=');
    if (separatorIndex > 0) {
      const key = pair.slice(0, separatorIndex).trim().toLowerCase();
      params[key] = unquote(pair.slice(separatorIndex + 1));
    }
  }
  return params;
}

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  const header = Array.isArray(value) ? value[0] : value;
  return header ? splitOutsideQuotes(header, ',')[0]?.trim() : undefined;
}

function coerceAuthority(authority: string | undefined): string | undefined {
  if (!authority) {
    return undefined;
  }
  try {
    return new URL(`http://${authority}`).host || undefined;
  } catch {
    return undefined;
  }
}

function coerceProtocol(protocol: string | undefined): 'http' | 'https' | undefined {
  // NOTE(@kitten): We should never receive "exp" or "exps" here, but account for them anyway for completeness
  switch (protocol?.toLowerCase()) {
    case 'http':
    case 'exp':
      return 'http';
    case 'https':
    case 'exps':
      return 'https';
    default:
      return undefined;
  }
}

/**
 * Resolve how the client addressed this dev server from the `Forwarded` (RFC 7239) header, falling
 * back to the `X-Forwarded-Host` and `X-Forwarded-Proto` headers.
 *
 * Returns `null` when the request carries no usable forwarding info, meaning the request reached
 * the dev server directly and its own address may be used.
 */
export function parseForwardedRequestInfo(req: ServerRequest): ForwardedRequestInfo | null {
  const headers = req.headers ?? {};
  const forwardedStr = firstHeaderValue(headers['forwarded']);
  const forwarded = forwardedStr ? parseForwardedHeader(forwardedStr) : null;
  const forwardedAuthority = coerceAuthority(forwarded?.host);
  const authority =
    forwardedAuthority ?? coerceAuthority(firstHeaderValue(headers['x-forwarded-host']));
  const protocol = coerceProtocol(
    forwarded?.proto ?? firstHeaderValue(headers['x-forwarded-proto'])
  );
  return authority || protocol
    ? { authority, protocol, viaForwardedHeader: forwardedAuthority != null }
    : null;
}
