import spawnAsync from '@expo/spawn-async';
import path from 'path';

const cliPath = path.resolve(__dirname, '..', '..', '..', 'bin', 'cli.js');

export async function getFingerprintFromCLIAsync(projectRoot: string, args: string[] = []) {
  try {
    const { stdout: fingerprintJSONFromCLI } = await spawnAsync(
      cliPath,
      ['fingerprint:generate', ...args],
      {
        stdio: 'pipe',
        cwd: projectRoot,
      }
    );
    return JSON.parse(fingerprintJSONFromCLI);
  } catch (e) {
    console.error(JSON.stringify(e));
    throw e;
  }
}

export async function getFingerprintHashFromCLIAsync(projectRoot: string, args: string[] = []) {
  const fingerprint = await getFingerprintFromCLIAsync(projectRoot, args);
  return fingerprint.hash;
}
