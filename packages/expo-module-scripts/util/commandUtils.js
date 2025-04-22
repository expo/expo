import spawnAsync from '@expo/spawn-async';

export async function commandRunner(command, params = [], processCwd = false) {
  return await spawnAsync(command, params, {
    stdio: 'inherit',
    cwd: processCwd ? process.cwd() : undefined,
  }).catch((error) => {
    process.exit(error.status);
  });
}

export function getArgs() {
  return process.argv.splice(2);
}
