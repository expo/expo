import spawnAsync from '@expo/spawn-async';
import path from 'path';

const cliPath = path.resolve(__dirname, '..', '..', '..', 'bin', 'cli.js');

export default async function getFingerprintHashFromCLIAsync(
  projectRoot: string,
  args: string[] = []
) {
  try {
    const { stdout: fingerprintJSONFromCLI } = await spawnAsync(
      cliPath,
      ['fingerprint:generate', ...args],
      {
        stdio: 'pipe',
        cwd: projectRoot,
      }
    );
    return JSON.parse(fingerprintJSONFromCLI).hash;
  } catch (e) {
    console.error(JSON.stringify(e));
    throw e;
  }
}
