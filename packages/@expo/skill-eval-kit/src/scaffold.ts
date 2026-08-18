import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

/**
 * Scaffolds the base app once per template with `bunx create-expo-app`
 * (network on the first run) and caches it; later runs copy the cache.
 * Vitest runs suites in parallel workers and concurrent `bunx
 * create-expo-app` invocations collide in bun's link step, so a
 * cross-process lock (atomic mkdir) serializes scaffolding: the winner
 * builds the cache, the others wait for it.
 */
export async function scaffoldBaseAppAsync(template: string): Promise<string> {
  const cacheDir = path.join(os.tmpdir(), `expo-skill-eval-base-${template}`);
  const isReady = () => fs.existsSync(path.join(cacheDir, 'package.json'));
  if (isReady()) {
    return cacheDir;
  }

  const lockDir = `${cacheDir}.lock`;
  for (;;) {
    if (isReady()) {
      return cacheDir;
    }
    try {
      fs.mkdirSync(lockDir);
      break;
    } catch {
      // Steal locks left behind by a crashed process.
      const age =
        Date.now() - (fs.statSync(lockDir, { throwIfNoEntry: false })?.mtimeMs ?? Date.now());
      if (age > 5 * 60_000) {
        fs.rmSync(lockDir, { recursive: true, force: true });
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  try {
    if (isReady()) {
      return cacheDir;
    }
    await scaffoldIntoCacheAsync(template, cacheDir);
    return cacheDir;
  } finally {
    fs.rmSync(lockDir, { recursive: true, force: true });
  }
}

async function scaffoldIntoCacheAsync(template: string, cacheDir: string): Promise<void> {
  const stagingDir = `${cacheDir}-staging-${process.pid}`;
  fs.rmSync(stagingDir, { recursive: true, force: true });
  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      'bunx',
      ['create-expo-app@latest', stagingDir, '--template', template, '--no-install'],
      {
        env: { ...process.env, CI: '1', EXPO_NO_TELEMETRY: '1' },
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );
    let output = '';
    child.stdout.on('data', (chunk) => (output += chunk));
    child.stderr.on('data', (chunk) => (output += chunk));
    child.on('close', (code) =>
      code === 0
        ? resolve()
        : reject(
            new Error(`bunx create-expo-app exited with ${code} (is bun installed?):\n${output}`)
          )
    );
    child.on('error', (error) => reject(new Error(`Could not run bunx: ${error}`)));
  });
  fs.rmSync(path.join(stagingDir, '.git'), { recursive: true, force: true });
  fs.rmSync(path.join(stagingDir, 'node_modules'), { recursive: true, force: true });
  fs.renameSync(stagingDir, cacheDir);
}
