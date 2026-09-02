// @ref llp/0010-agent-conventions.rfc.md §Suggestions are pasted, so they have to be runnable
//
// The samples are the real environments, captured from `bunx`, `bun run` and `npx` on one machine
// [observed — bun 1.3.14, npm 11.17.0, node 26.5.0, 2026-08-25]. The one that matters is the first:
// `bunx` honours a `#!/usr/bin/env node` shebang, so this package's own bin runs on **Node** under
// `bunx` and `process.versions.bun` is not set — the user agent is what tells them apart.

import { detectInvoker, renderForInvoker, resetInvokerCache } from '../invoker';

const BUNX_ENV = {
  npm_config_user_agent: 'bun/1.3.14 npm/? node/v24.3.0 darwin arm64',
  npm_execpath: '/opt/homebrew/Cellar/bun/1.3.14/bin/bun',
};

const NPX_ENV = {
  npm_config_user_agent: 'npm/11.17.0 node/v26.5.0 darwin arm64 workspaces/false',
  npm_execpath: '/opt/homebrew/lib/node_modules/npm/bin/npm-cli.js',
};

afterEach(() => resetInvokerCache());

describe(detectInvoker, () => {
  it(`reads the user agent bunx sets, though the process runs on Node`, () => {
    expect(detectInvoker(BUNX_ENV)).toBe('bunx');
  });

  it(`reads npx as npx`, () => {
    expect(detectInvoker(NPX_ENV)).toBe('npx');
  });

  it(`reads the bun binary in npm_execpath, for a Bun that stops setting the user agent`, () => {
    expect(detectInvoker({ npm_execpath: '/usr/local/bin/bun' })).toBe('bunx');
    expect(detectInvoker({ npm_execpath: 'C:\\Users\\me\\.bun\\bin\\bun.exe' })).toBe('bunx');
  });

  it(`answers npx for a shell that says nothing`, () => {
    expect(detectInvoker({})).toBe('npx');
  });

  // Bun being installed is not Bun being used: a Mac with `~/.bun` running `npx @expo/agent-cli` must not
  // be handed a line spelled for a runner it is not in.
  it(`ignores a machine that merely has Bun installed`, () => {
    expect(detectInvoker({ BUN_INSTALL: '/Users/me/.bun', ...NPX_ENV })).toBe('npx');
  });

  it(`is not fooled by another tool whose path ends in something like bun`, () => {
    expect(detectInvoker({ npm_execpath: '/usr/local/bin/bunyan' })).toBe('npx');
  });
});

describe(renderForInvoker, () => {
  it(`leaves every line alone under npx`, () => {
    expect(renderForInvoker('Try: npx @expo/agent-cli dev --detach', 'npx')).toBe(
      'Try: npx @expo/agent-cli dev --detach'
    );
  });

  it(`spells this CLI the way a Bun project runs it`, () => {
    expect(renderForInvoker('Try: npx @expo/agent-cli dev --detach', 'bunx')).toBe(
      'Try: bunx @expo/agent-cli dev --detach'
    );
  });

  it(`rewrites every occurrence in one line`, () => {
    expect(
      renderForInvoker('Run npx @expo/agent-cli dev, then npx @expo/agent-cli smoke.', 'bunx')
    ).toBe('Run bunx @expo/agent-cli dev, then bunx @expo/agent-cli smoke.');
  });

  // `npx eas-cli` is a different package name under Bun and `npx expo` may be too, so a blanket
  // swap would produce lines that do not run. Only this CLI's own name is safe to rewrite.
  it(`leaves other CLIs alone`, () => {
    expect(renderForInvoker('npx eas build --profile production', 'bunx')).toBe(
      'npx eas build --profile production'
    );
    expect(renderForInvoker('npx expo start --tunnel', 'bunx')).toBe('npx expo start --tunnel');
  });

  it(`leaves a URL that happens to contain the words alone`, () => {
    expect(renderForInvoker('exp://npx-agent-cli.example.com', 'bunx')).toBe(
      'exp://npx-agent-cli.example.com'
    );
  });
});
