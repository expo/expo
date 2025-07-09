import spawnAsync from '@expo/spawn-async';
import path from 'path';

const cliPath = path.resolve(__dirname, '..', '..', '..', 'bin', 'cli.js');

export default async function runCLIAsync(
  projectRoot: string,
  command: string,
  args: string[] = []
) {
  try {
    const { stdout } = await spawnAsync(cliPath, [command, ...args], {
      stdio: 'pipe',
      cwd: projectRoot,
    });
    return stdout;
  } catch (e) {
    console.error(JSON.stringify(e));
    throw e;
  }
}
