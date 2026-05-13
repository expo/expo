import spawnAsync from '@expo/spawn-async';

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

export function getArgs({ maybeAddWatchFlag = false } = {}) {
  let args = process.argv.slice(2);
  if (maybeAddWatchFlag) {
    args = addWatchFlagIfNeeded(args);
  }
  return args;
}

function shouldAddWatchFlag() {
  return process.stdout.isTTY && !process.env.CI && !process.env.EXPO_NONINTERACTIVE;
}

export function addWatchFlagIfNeeded(args) {
  if (shouldAddWatchFlag() && !args.includes('--watch')) {
    args.push('--watch');
  }
  return args;
}
