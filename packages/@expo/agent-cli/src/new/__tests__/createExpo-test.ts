import { vol } from 'memfs';
import path from 'path';

import { buildCreateExpoArgs, resolveCreateExpoCli } from '../createExpo';

afterEach(() => {
  vol.reset();
});

describe(buildCreateExpoArgs, () => {
  it(`should always answer the prompts of create-expo with --yes`, () => {
    expect(buildCreateExpoArgs('my-app', { install: true })).toEqual(['my-app', '--yes']);
  });

  it(`should forward --no-install`, () => {
    expect(buildCreateExpoArgs('my-app', { install: false })).toEqual([
      'my-app',
      '--yes',
      '--no-install',
    ]);
  });

  it(`should pass the directory as typed, so create-expo names the app from it`, () => {
    expect(buildCreateExpoArgs('apps/my-app', { install: true })).toEqual(['apps/my-app', '--yes']);
  });
});

describe(resolveCreateExpoCli, () => {
  it(`should prefer a create-expo on PATH`, () => {
    vol.fromJSON({ '/usr/local/bin/create-expo': '#!/bin/sh' });

    expect(resolveCreateExpoCli({ pathEnv: '/usr/local/bin' })).toEqual({
      command: path.join('/usr/local/bin', 'create-expo'),
      args: [],
    });
  });

  it(`should fall back to npx create-expo@latest`, () => {
    expect(resolveCreateExpoCli({ pathEnv: '/usr/local/bin' })).toEqual({
      command: expect.stringMatching(/^npx(\.cmd)?$/),
      args: ['create-expo@latest'],
    });
  });
});
