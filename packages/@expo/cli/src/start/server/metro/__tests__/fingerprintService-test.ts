import { vol } from 'memfs';

import {
  getPrebuildFingerprintMarkerPath,
  importFingerprint,
} from '../../../../utils/nativeFingerprint';
import { createFingerprintService } from '../fingerprintService';

jest.mock('../../../../utils/nativeFingerprint', () => ({
  ...jest.requireActual('../../../../utils/nativeFingerprint'),
  importFingerprint: jest.fn(),
}));

const projectRoot = '/app';

afterEach(() => {
  vol.reset();
});

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function mockFingerprintModule(createFingerprintAsync: jest.Mock) {
  jest.mocked(importFingerprint).mockReturnValue({
    Fingerprint: { createFingerprintAsync } as any,
    version: '0.20.6',
  });
  return createFingerprintAsync;
}

describe(createFingerprintService, () => {
  it(`computes with the parity options and caches per platform`, async () => {
    const compute = mockFingerprintModule(jest.fn(async () => ({ hash: 'hash-a', sources: [] })));
    const service = createFingerprintService(projectRoot, { warn: jest.fn() });

    await expect(service.getFingerprintAsync('ios')).resolves.toEqual({
      hash: 'hash-a',
      fingerprintVersion: '0.20.6',
      sources: [],
    });
    await service.getFingerprintAsync('ios');
    expect(compute).toHaveBeenCalledTimes(1);
    expect(compute).toHaveBeenCalledWith(projectRoot, { platforms: ['ios'], silent: true });

    await service.getFingerprintAsync('android');
    expect(compute).toHaveBeenCalledTimes(2);
  });

  it(`shares an in-flight computation`, async () => {
    const deferred = createDeferred<{ hash: string; sources: never[] }>();
    const compute = mockFingerprintModule(jest.fn(() => deferred.promise));
    const service = createFingerprintService(projectRoot, { warn: jest.fn() });

    const first = service.getFingerprintAsync('ios');
    const second = service.getFingerprintAsync('ios');
    deferred.resolve({ hash: 'hash-a', sources: [] });
    const expected = { hash: 'hash-a', fingerprintVersion: '0.20.6', sources: [] };
    await expect(first).resolves.toEqual(expected);
    await expect(second).resolves.toEqual(expected);
    expect(compute).toHaveBeenCalledTimes(1);
  });

  it(`recomputes after onFileChange`, async () => {
    const compute = mockFingerprintModule(
      jest
        .fn()
        .mockResolvedValueOnce({ hash: 'hash-a', sources: [] })
        .mockResolvedValueOnce({ hash: 'hash-b', sources: [] })
    );
    const service = createFingerprintService(projectRoot, { warn: jest.fn() });

    await expect(service.getFingerprintAsync('ios')).resolves.toMatchObject({ hash: 'hash-a' });
    service.onFileChange();
    await expect(service.getFingerprintAsync('ios')).resolves.toMatchObject({ hash: 'hash-b' });
    expect(compute).toHaveBeenCalledTimes(2);
  });

  it(`does not repopulate the cache when a stale compute resolves after a clear`, async () => {
    const stale = createDeferred<{ hash: string; sources: never[] }>();
    const compute = mockFingerprintModule(
      jest
        .fn()
        .mockReturnValueOnce(stale.promise)
        .mockResolvedValueOnce({ hash: 'hash-b', sources: [] })
    );
    const service = createFingerprintService(projectRoot, { warn: jest.fn() });

    const first = service.getFingerprintAsync('ios');
    service.onFileChange();
    stale.resolve({ hash: 'hash-a', sources: [] });
    await expect(first).resolves.toMatchObject({ hash: 'hash-a' });

    await expect(service.getFingerprintAsync('ios')).resolves.toMatchObject({ hash: 'hash-b' });
    expect(compute).toHaveBeenCalledTimes(2);
  });

  it(`does not cache a failed computation`, async () => {
    const compute = mockFingerprintModule(
      jest
        .fn()
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValueOnce({ hash: 'hash-b', sources: [] })
    );
    const service = createFingerprintService(projectRoot, { warn: jest.fn() });

    await expect(service.getFingerprintAsync('ios')).rejects.toThrow('boom');
    await expect(service.getFingerprintAsync('ios')).resolves.toMatchObject({ hash: 'hash-b' });
    expect(compute).toHaveBeenCalledTimes(2);
  });

  it(`resolves null when the fingerprint package is unresolvable`, async () => {
    jest.mocked(importFingerprint).mockReturnValue(null);
    const service = createFingerprintService(projectRoot, { warn: jest.fn() });
    await expect(service.getFingerprintAsync('ios')).resolves.toBeNull();
  });

  describe('recordClientFingerprint', () => {
    const server = { hash: 'server-hash', fingerprintVersion: '0.20.6', sources: [] };

    it(`warns once per platform and project state`, () => {
      const warn = jest.fn();
      const service = createFingerprintService(projectRoot, { warn });

      service.recordClientFingerprint('ios', 'stale-hash', server);
      service.recordClientFingerprint('ios', 'stale-hash', server);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain('npx expo run:ios');

      service.recordClientFingerprint('android', 'stale-hash', server);
      expect(warn).toHaveBeenCalledTimes(2);

      // The project changed — the same platform warns again for the new state.
      service.recordClientFingerprint('ios', 'stale-hash', {
        ...server,
        hash: 'new-server-hash',
      });
      expect(warn).toHaveBeenCalledTimes(3);
    });

    it(`does not warn on a match and returns no advice`, () => {
      const warn = jest.fn();
      const service = createFingerprintService(projectRoot, { warn });
      expect(service.recordClientFingerprint('ios', 'server-hash', server)).toBeNull();
      expect(warn).not.toHaveBeenCalled();
    });

    it(`returns advice on every mismatch, even when the warning is suppressed`, () => {
      const warn = jest.fn();
      const service = createFingerprintService(projectRoot, { warn });

      const first = service.recordClientFingerprint('ios', 'stale-hash', server);
      const second = service.recordClientFingerprint('ios', 'stale-hash', server);
      expect(warn).toHaveBeenCalledTimes(1);
      // The advice feeds the HTTP response, so each stale client gets it — not just the first.
      expect(first).toEqual({
        recommendation: expect.stringContaining('does not match the project'),
        commands: ['npx expo run:ios'],
      });
      expect(second).toEqual(first);
    });

    it(`recommends prebuild first when the native directories are stale`, () => {
      const configSource = (hash: string) => ({
        type: 'contents' as const,
        id: 'expoConfig',
        contents: '{}',
        reasons: ['expoConfig'],
        hash,
      });
      vol.fromJSON({
        [`${projectRoot}/ios/Podfile`]: '',
        [getPrebuildFingerprintMarkerPath(projectRoot, 'ios')]: JSON.stringify({
          version: 1,
          platform: 'ios',
          hash: 'marker-hash',
          sources: [configSource('old-config')],
          fingerprintVersion: '0.20.6',
          createdAt: '2026-08-13T00:00:00.000Z',
        }),
      });
      const warn = jest.fn();
      const service = createFingerprintService(projectRoot, { warn });

      const advice = service.recordClientFingerprint('ios', 'stale-hash', {
        ...server,
        sources: [configSource('new-config')],
      });

      // A plain rebuild would compile the stale directories and embed the new hash, so the
      // advice must name prebuild first — and say what changed.
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain('npx expo prebuild -p ios');
      expect(warn.mock.calls[0][0]).toContain('app config');
      expect(advice).toEqual({
        recommendation: expect.stringContaining('app config'),
        commands: ['npx expo prebuild -p ios', 'npx expo run:ios'],
      });
    });

    it(`recommends a plain rebuild when the native directories are up to date`, () => {
      const warn = jest.fn();
      const service = createFingerprintService(projectRoot, { warn });
      // No native directory: nothing to regenerate, so the app itself is what's stale.
      service.recordClientFingerprint('ios', 'stale-hash', server);
      expect(warn.mock.calls[0][0]).toContain('npx expo run:ios');
      expect(warn.mock.calls[0][0]).not.toContain('prebuild');
    });

    it(`is immune to a flood of distinct announced hashes`, () => {
      const warn = jest.fn();
      const service = createFingerprintService(projectRoot, { warn });

      // Announced hashes are attacker-controlled; the warning is keyed by project state,
      // so a spammer producing endless distinct hashes triggers exactly one warning.
      for (let i = 0; i < 400; i++) {
        service.recordClientFingerprint('ios', `spam-${i}`, server);
      }
      expect(warn).toHaveBeenCalledTimes(1);
    });
  });
});
