export interface VerifyRequestOriginOptions {
  /** Additional allowed origins (e.g. ['https://admin.example.com']) */
  trustedOrigins?: string[];
  /** Allow requests without an Origin or Referer header (default: true, for native apps & webhooks) */
  allowMissing?: boolean;
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function isOriginTrusted(origin: string, trustedOrigins?: string[]): boolean {
  if (!trustedOrigins || trustedOrigins.length === 0) {
    return false;
  }
  for (const trusted of trustedOrigins) {
    if (trusted === origin) {
      return true;
    }
    if (URL.canParse(trusted)) {
      try {
        if (new URL(trusted).origin === origin) {
          return true;
        }
      } catch {
        // Ignore parse errors on invalid trusted origin entries
      }
    }
  }
  return false;
}

/**
 * Validates that an incoming HTTP request originates from the same origin
 * or an explicitly trusted origin, protecting against CSRF attacks.
 */
export function verifyRequestOrigin(
  request: Request,
  options?: VerifyRequestOriginOptions
): boolean {
  // RFC 7231 Section 4.2.1: Safe methods do not modify server state
  if (SAFE_METHODS.has(request.method)) {
    return true;
  }

  const origin = request.headers.get('origin');

  if (origin !== null && origin !== undefined) {
    // Reject opaque origins from sandboxed iframes or data: URLs
    if (origin === 'null' || !URL.canParse(origin)) {
      return false;
    }

    const originUrl = new URL(origin);

    // Check explicitly trusted origins
    if (isOriginTrusted(originUrl.origin, options?.trustedOrigins)) {
      return true;
    }

    try {
      const targetUrl = new URL(request.url);
      return originUrl.origin === targetUrl.origin;
    } catch {
      return false;
    }
  }

  // Fallback to Referer header if Origin is absent
  const referer = request.headers.get('referer');
  if (referer !== null && referer !== undefined) {
    // A present but unparseable Referer must be rejected, not treated as missing
    if (!URL.canParse(referer)) {
      return false;
    }

    try {
      const refererUrl = new URL(referer);

      // Check explicitly trusted origins on Referer as well
      if (isOriginTrusted(refererUrl.origin, options?.trustedOrigins)) {
        return true;
      }

      const targetUrl = new URL(request.url);
      return refererUrl.origin === targetUrl.origin;
    } catch {
      return false;
    }
  }

  // Non-browser clients (native mobile apps, webhooks, CLI tools) lacking both Origin and Referer
  return options?.allowMissing ?? true;
}
