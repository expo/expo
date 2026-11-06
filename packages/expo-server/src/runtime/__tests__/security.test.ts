import { verifyRequestOrigin } from '../security';

describe('verifyRequestOrigin', () => {
  it('allows same-origin mutation requests', () => {
    const request = new Request('http://localhost:8104/api/account', {
      method: 'POST',
      headers: {
        Origin: 'http://localhost:8104',
        Host: 'localhost:8104',
      },
    });

    expect(verifyRequestOrigin(request)).toBe(true);
  });

  it('rejects cross-origin mutation requests', () => {
    const request = new Request('http://localhost:8104/api/account', {
      method: 'POST',
      headers: {
        Origin: 'http://evil.com',
        Host: 'localhost:8104',
      },
    });

    expect(verifyRequestOrigin(request)).toBe(false);
  });

  it('rejects cross-origin login CSRF mutation requests', () => {
    const request = new Request('http://localhost:8104/api/login', {
      method: 'POST',
      headers: {
        Origin: 'http://attacker-site.com',
        Host: 'localhost:8104',
      },
    });

    expect(verifyRequestOrigin(request)).toBe(false);
  });

  it('rejects opaque origin "null" from sandboxed iframes', () => {
    const request = new Request('http://localhost:8104/api/account', {
      method: 'POST',
      headers: {
        Origin: 'null',
        Host: 'localhost:8104',
      },
    });

    expect(verifyRequestOrigin(request)).toBe(false);
  });

  it('allows non-browser mutation requests lacking Origin and Referer by default', () => {
    const request = new Request('http://localhost:8104/api/webhook', {
      method: 'POST',
      headers: {
        Host: 'localhost:8104',
      },
    });

    expect(verifyRequestOrigin(request)).toBe(true);
  });

  it('rejects requests lacking Origin and Referer when allowMissing is false', () => {
    const request = new Request('http://localhost:8104/api/strict', {
      method: 'POST',
      headers: {
        Host: 'localhost:8104',
      },
    });

    expect(verifyRequestOrigin(request, { allowMissing: false })).toBe(false);
  });

  it('allows safe HTTP methods (GET, HEAD, OPTIONS) regardless of Origin', () => {
    for (const method of ['GET', 'HEAD', 'OPTIONS']) {
      const request = new Request('http://localhost:8104/api/data', {
        method,
        headers: {
          Origin: 'http://evil.com',
          Host: 'localhost:8104',
        },
      });

      expect(verifyRequestOrigin(request)).toBe(true);
    }
  });

  it('enforces origin validation on all non-safe and custom HTTP methods', () => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'PURGE']) {
      const request = new Request('http://localhost:8104/api/data', {
        method,
        headers: {
          Origin: 'http://evil.com',
          Host: 'localhost:8104',
        },
      });

      expect(verifyRequestOrigin(request)).toBe(false);
    }
  });

  it('allows explicitly configured trusted origins in Origin header', () => {
    const request = new Request('http://localhost:8104/api/account', {
      method: 'POST',
      headers: {
        Origin: 'https://trusted.example.com',
        Host: 'localhost:8104',
      },
    });

    const result = verifyRequestOrigin(request, {
      trustedOrigins: ['https://trusted.example.com'],
    });

    expect(result).toBe(true);
  });

  it('normalizes trusted origins with trailing slashes correctly', () => {
    const request = new Request('http://localhost:8104/api/account', {
      method: 'POST',
      headers: {
        Origin: 'https://trusted.example.com',
        Host: 'localhost:8104',
      },
    });

    const result = verifyRequestOrigin(request, {
      trustedOrigins: ['https://trusted.example.com/'],
    });

    expect(result).toBe(true);
  });

  it('rejects malformed Origin headers safely', () => {
    const request = new Request('http://localhost:8104/api/account', {
      method: 'POST',
      headers: {
        Origin: 'not-a-valid-url',
        Host: 'localhost:8104',
      },
    });

    expect(verifyRequestOrigin(request)).toBe(false);
  });

  it('falls back to Referer when Origin is absent and rejects cross-origin Referer', () => {
    const request = new Request('http://localhost:8104/api/account', {
      method: 'POST',
      headers: {
        Referer: 'http://evil.com/page',
        Host: 'localhost:8104',
      },
    });

    expect(verifyRequestOrigin(request)).toBe(false);
  });

  it('falls back to Referer when Origin is absent and allows same-origin Referer', () => {
    const request = new Request('http://localhost:8104/api/account', {
      method: 'POST',
      headers: {
        Referer: 'http://localhost:8104/form',
        Host: 'localhost:8104',
      },
    });

    expect(verifyRequestOrigin(request)).toBe(true);
  });

  it('rejects present but malformed Referer headers instead of treating them as absent', () => {
    const request = new Request('http://localhost:8104/api/account', {
      method: 'POST',
      headers: {
        Referer: 'invalid-url-string',
        Host: 'localhost:8104',
      },
    });

    expect(verifyRequestOrigin(request)).toBe(false);
  });

  it('allows explicitly configured trusted origins in Referer header when Origin is absent', () => {
    const request = new Request('http://localhost:8104/api/account', {
      method: 'POST',
      headers: {
        Referer: 'https://trusted.example.com/checkout',
        Host: 'localhost:8104',
      },
    });

    const result = verifyRequestOrigin(request, {
      trustedOrigins: ['https://trusted.example.com'],
    });

    expect(result).toBe(true);
  });
});
