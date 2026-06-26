import spawnAsync from '@expo/spawn-async';
import fs from 'node:fs';
import path from 'node:path';
// `resolve-workspace-root` is CommonJS, so destructure off the default import under ESM.
import resolveWorkspaceRootPkg from 'resolve-workspace-root';

const { resolveWorkspaceRoot } = resolveWorkspaceRootPkg;

export async function commandRunner(command, params = [], { cwd } = {}) {
  return await spawnAsync(command, params, {
    stdio: 'inherit',
    cwd: cwd ?? process.cwd(),
  }).catch((error) => {
    console.error(`Command failed: ${command} ${params.join(' ')}`);
    if (error.message) {
      console.error(error.message);
    }
    process.exit(error.status || error.code || 1);
  });
}

export async function packageManagerExecAsync(params, { cwd } = {}) {
  let command = '';
  const args = [];

  const npmConfigUserAgent = process.env.npm_config_user_agent;
  if (npmConfigUserAgent?.includes('yarn')) {
    command = 'yarn';
    args.push(...params);
  } else if (npmConfigUserAgent?.includes('pnpm')) {
    command = 'pnpm';
    args.push(...params);
  } else if (npmConfigUserAgent?.includes('bun')) {
    command = 'bunx';
    args.push(...params);
  } else {
    command = 'npx';
    args.push(...params);
  }

  return commandRunner(command, args, { cwd });
}

export async function packageManagerRunAsync(params, { cwd } = {}) {
  let command = '';
  const args = [];

  const npmConfigUserAgent = process.env.npm_config_user_agent;
  if (npmConfigUserAgent?.includes('yarn')) {
    command = 'yarn';
    args.push(...params);
  } else if (npmConfigUserAgent?.includes('pnpm')) {
    command = 'pnpm';
    args.push('run', ...params);
  } else if (npmConfigUserAgent?.includes('bun')) {
    command = 'bun';
    args.push('run', ...params);
  } else {
    command = 'npm';
    args.push('run', ...params);
  }

  return commandRunner(command, args, { cwd });
}

/** Returns the workspace root for `cwd` if it has a `turbo.json`, otherwise `null`. */
export function findTurboWorkspaceRoot(cwd = process.cwd()) {
  const workspaceRoot = resolveWorkspaceRoot(cwd);
  if (!workspaceRoot) {
    return null;
  }
  const hasTurboConfig =
    fs.existsSync(path.join(workspaceRoot, 'turbo.json')) ||
    fs.existsSync(path.join(workspaceRoot, 'turbo.jsonc'));
  return hasTurboConfig ? workspaceRoot : null;
}

export function getArgs({ maybeAddWatchFlag = false } = {}) {
  let args = process.argv.slice(2);
  if (maybeAddWatchFlag) {
    args = addWatchFlagIfNeeded(args);
  }
  return args;
}

function shouldAddWatchFlag() {
  if (process.env.TURBO_HASH && process.env.TURBO_IS_TUI !== 'true') {
    return false;
  }
  return process.stdout.isTTY && !process.env.CI && !process.env.EXPO_NONINTERACTIVE;
}

export function addWatchFlagIfNeeded(args) {
  if (shouldAddWatchFlag() && !args.includes('--watch')) {
    args.push('--watch');
  }
  return args;
}
