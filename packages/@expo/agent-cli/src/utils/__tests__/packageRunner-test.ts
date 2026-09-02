// @ref src/utils/packageRunner.ts
//
// The environments are the real ones, captured on the machine this was written on [observed — bun
// 1.3.14, npm 11.17.0, node 26.5.0, 2026-08-26]. The case the module exists for is the first one:
// `bunx @expo/agent-cli` runs this package's bin on **Node**, because `bunx` honours a
// `#!/usr/bin/env node` shebang — so nothing in-process says "bun", and a hardcoded `npx` then
// sent a Bun user to npm's exec for every package this CLI spawns.

import { vol } from 'memfs';
import path from 'path';

import { resetInvokerCache } from '../invoker';
import {
  packageRunnerLabel,
  resetPackageRunnerCache,
  resolvePackageRunner,
} from '../packageRunner';

const BUNX_ENV = {
  npm_config_user_agent: 'bun/1.3.14 npm/? node/v24.3.0 darwin arm64',
  npm_execpath: '/opt/homebrew/Cellar/bun/1.3.14/bin/bun',
};

const NPX_ENV = {
  npm_config_user_agent: 'npm/11.17.0 node/v26.5.0 darwin arm64 workspaces/false',
  npm_execpath: '/opt/homebrew/lib/node_modules/npm/bin/npm-cli.js',
};

const binDir = path.resolve('/opt/homebrew/bin');
const bunxPath = path.join(binDir, 'bunx');
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

beforeEach(() => {
  vol.reset();
  resetInvokerCache();
  resetPackageRunnerCache();
});

describe(resolvePackageRunner, () => {
  it(`should run packages with bunx when bunx started this process`, () => {
    vol.fromJSON({ [bunxPath]: '' });

    expect(resolvePackageRunner({ env: BUNX_ENV, pathEnv: binDir })).toEqual({
      runner: 'bunx',
      command: bunxPath,
    });
  });

  it(`should run packages with npx when npx started this process`, () => {
    vol.fromJSON({ [bunxPath]: '' });

    expect(resolvePackageRunner({ env: NPX_ENV, pathEnv: binDir })).toEqual({
      runner: 'npx',
      command: npxCommand,
    });
  });

  // Detection says which runner *started* this process, which is not the same as "that runner is
  // reachable from here". A `bunx` that cannot be found is not a `bunx` that can be spawned.
  it(`should fall back to npx when bun started this process but bunx is not on PATH`, () => {
    expect(resolvePackageRunner({ env: BUNX_ENV, pathEnv: binDir })).toEqual({
      runner: 'npx',
      command: npxCommand,
    });
  });

  it(`should answer once per process`, () => {
    vol.fromJSON({ [bunxPath]: '' });

    const first = resolvePackageRunner({ env: BUNX_ENV, pathEnv: binDir });
    // The environment does not change under a running command, so neither does the answer — even
    // asked with an environment that would decide differently.
    expect(resolvePackageRunner({ env: NPX_ENV, pathEnv: binDir })).toEqual(first);
  });
});

describe(packageRunnerLabel, () => {
  // What gets printed and evented is the runner's *name*, not the path it was found at: `bunx` is
  // what a reader would type, and `/opt/homebrew/bin/bunx` is noise in a sentence about which
  // runner ran.
  it(`should name the runner rather than the path it resolved to`, () => {
    expect(packageRunnerLabel({ runner: 'bunx', command: bunxPath })).toBe('bunx');
    expect(packageRunnerLabel({ runner: 'npx', command: 'npx' })).toBe('npx');
  });
});
