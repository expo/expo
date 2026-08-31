import http from 'http';
import net from 'net';

import { getGatewayAsync } from '../../utils/ip';
import { startFingerprintCallbackServerAsync } from '../fingerprintCallbackServer';
import { CALLBACK_PATH } from '../fingerprintCheckProtocol';

jest.mock('../../utils/ip');

beforeEach(() => {
  jest.mocked(getGatewayAsync).mockResolvedValue({
    address: '192.168.1.50',
    iname: 'en0',
    gateway: '192.168.1.1',
    internal: false,
  });
});

/** The advertised callback host is a fake LAN address; tests always connect over loopback. */
function loopbackUrl(callbackUrl: string): string {
  const url = new URL(callbackUrl);
  return `http://127.0.0.1:${url.port}${url.pathname}`;
}

describe(startFingerprintCallbackServerAsync, () => {
  it(`resolves with the fingerprint when the nonce matches, and responds 200`, async () => {
    const { callbackUrl, result, close } = await startFingerprintCallbackServerAsync({
      nonce: 'abc',
    });
    try {
      const response = await fetch(loopbackUrl(callbackUrl), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nonce: 'abc', fingerprint: 'hash-1' }),
      });
      expect(response.status).toBe(200);
      await expect(result).resolves.toEqual({ fingerprint: 'hash-1' });
    } finally {
      close();
    }
  });

  it(`passes a null fingerprint through unchanged`, async () => {
    const { callbackUrl, result, close } = await startFingerprintCallbackServerAsync({
      nonce: 'abc',
    });
    try {
      const response = await fetch(loopbackUrl(callbackUrl), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nonce: 'abc', fingerprint: null }),
      });
      expect(response.status).toBe(200);
      await expect(result).resolves.toEqual({ fingerprint: null });
    } finally {
      close();
    }
  });

  it(`rejects a mismatched nonce with 400 and keeps waiting for the right one`, async () => {
    const { callbackUrl, result, close } = await startFingerprintCallbackServerAsync({
      nonce: 'abc',
      timeoutMs: 5000,
    });
    try {
      const url = loopbackUrl(callbackUrl);
      const wrongResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nonce: 'wrong', fingerprint: 'hash-1' }),
      });
      expect(wrongResponse.status).toBe(400);

      const rightResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nonce: 'abc', fingerprint: 'hash-2' }),
      });
      expect(rightResponse.status).toBe(200);
      await expect(result).resolves.toEqual({ fingerprint: 'hash-2' });
    } finally {
      close();
    }
  });

  it(`rejects a malformed JSON body with 400`, async () => {
    const { callbackUrl, result, close } = await startFingerprintCallbackServerAsync({
      nonce: 'abc',
      timeoutMs: 200,
    });
    try {
      const response = await fetch(loopbackUrl(callbackUrl), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not json',
      });
      expect(response.status).toBe(400);
      // The server keeps listening after a malformed body; only the timeout settles it here.
      await expect(result).resolves.toBeNull();
    } finally {
      close();
    }
  });

  it(`resolves null when no response arrives before the timeout`, async () => {
    const { result, close } = await startFingerprintCallbackServerAsync({
      nonce: 'abc',
      timeoutMs: 50,
    });
    try {
      await expect(result).resolves.toBeNull();
    } finally {
      close();
    }
  });

  it(`close() frees the port and is idempotent`, async () => {
    const first = await startFingerprintCallbackServerAsync({
      nonce: 'abc',
      timeoutMs: 5000,
    });
    const port = Number(new URL(first.callbackUrl).port);
    first.close();
    first.close();

    // The exact same port must be bindable again — `port: 0` on a second server would prove
    // nothing about the first one having been released.
    await expect(
      new Promise<void>((resolve, reject) => {
        const probe = http.createServer();
        probe.once('error', reject);
        probe.listen({ port, host: '0.0.0.0' }, () => probe.close(() => resolve()));
      })
    ).resolves.toBeUndefined();
  });

  it(`close() destroys an in-flight request instead of waiting for it`, async () => {
    const { callbackUrl, result, close } = await startFingerprintCallbackServerAsync({
      nonce: 'abc',
      timeoutMs: 5000,
    });
    const url = new URL(loopbackUrl(callbackUrl));

    // A half-sent request (announced body never delivered) — e.g. Wi-Fi drop mid-POST.
    const socket = net.connect(Number(url.port), url.hostname);
    // The server resetting the connection is the expected outcome, not a test failure.
    socket.on('error', () => {});
    await new Promise((resolve) => socket.once('connect', resolve));
    socket.write(`POST ${CALLBACK_PATH} HTTP/1.1\r\nHost: x\r\nContent-Length: 1000\r\n\r\n{"a`);

    close();
    // The socket must be torn down by the server; otherwise the process outlives the verdict.
    await new Promise((resolve) => socket.once('close', resolve));
    await expect(result).resolves.toBeNull();
  });

  it(`rejects a body larger than the cap with 413`, async () => {
    const { callbackUrl, result, close } = await startFingerprintCallbackServerAsync({
      nonce: 'abc',
      timeoutMs: 500,
    });
    try {
      const response = await fetch(loopbackUrl(callbackUrl), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: `{"nonce":"abc","fingerprint":"${'x'.repeat(10_000)}"}`,
      }).catch(() => null);
      // Either an explicit 413 or a destroyed connection is acceptable; the response must not
      // be accepted.
      if (response) {
        expect(response.status).toBe(413);
      }
      await expect(result).resolves.toBeNull();
    } finally {
      close();
    }
  });

  it(`throws when the machine has no LAN address for a phone to reach`, async () => {
    jest.mocked(getGatewayAsync).mockResolvedValue({
      address: '127.0.0.1',
      iname: null,
      gateway: null,
      internal: true,
    });
    await expect(startFingerprintCallbackServerAsync({ nonce: 'abc' })).rejects.toThrow(
      /no LAN address/
    );
  });
});
