// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0005
//
// The `runtime:network` half of `src/runtime/__tests__/resolveOptions-test.ts`, moved with the
// code it covers. Not run: `jest.config.js` ignores this directory.
//
// The live resolver took the action as `argv[0]`, so these call it as `resolveRuntimeCommand`
// did; `../resolveOptions` is the extracted `resolveRuntimeNetworkCommand`, which reads the
// same argv with the action still on the front.

import { resolveRuntimeNetworkCommand as resolveRuntimeCommand } from '../resolveOptions';

describe(resolveRuntimeCommand, () => {
  // A failed request is something `network` reports about the app, not a verdict on it.
  it(`should reject --fail-on-error on network`, () => {
    expect(() => resolveRuntimeCommand(['network', '--fail-on-error'])).toThrow(/--fail-on-error/);
  });

  it(`should default the window of network`, () => {
    expect(resolveRuntimeCommand(['network'])).toEqual({
      action: 'network',
      devServerUrl: null,
      durationMs: 5000,
      json: false,
      followups: true,
    });
  });

  it(`should read the network flags`, () => {
    expect(
      resolveRuntimeCommand([
        'network',
        '--duration',
        '10000',
        '--dev-server-url',
        'http://192.168.1.10:8081/',
        '--json',
        '--no-followups',
      ])
    ).toEqual({
      action: 'network',
      devServerUrl: 'http://192.168.1.10:8081',
      durationMs: 10000,
      json: true,
      followups: false,
    });
  });

  it(`should reject a flag of another action on network`, () => {
    expect(() => resolveRuntimeCommand(['network', '--timeout', '10'])).toThrow(/--timeout/);
  });

  it(`should reject an argument after network`, () => {
    expect(() => resolveRuntimeCommand(['network', 'GET'])).toThrow(/Unexpected argument: GET/);
  });

});
