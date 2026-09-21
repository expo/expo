import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

export async function startGatewayAsync(accountId: string, signal?: AbortSignal) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'expo-docs-eval-'));
  try {
    const config = await readFile(new URL('../../wrangler.toml', import.meta.url), 'utf8');
    await writeFile(
      path.join(directory, 'wrangler.toml'),
      `account_id = ${JSON.stringify(accountId)}\n` +
        config.replace(/^name = .*$/m, 'name = "expo-docs-eval"').replace('"out"', '"."')
    );
    await writeFile(
      path.join(directory, '_worker.js'),
      `export default {
      async fetch(request, env) {
        if (request.method !== 'POST') return new Response(null, { status: 405 });
        const { model, input, gateway, timeoutMs } = await request.json();
        try {
          const result = await env.AI.run(model, input, {
            gateway: { ...gateway, skipCache: true },
            signal: AbortSignal.any([request.signal, AbortSignal.timeout(timeoutMs)]),
          });
          return Response.json({ result });
        } catch (error) {
          return Response.json({ error: error.message }, { status: 502 });
        }
      }
    };`
    );
    const require = createRequire(import.meta.url);
    signal?.throwIfAborted();
    const child = spawn(
      process.execPath,
      [
        require.resolve('wrangler/bin/wrangler.js'),
        'pages',
        'dev',
        '--ip',
        '127.0.0.1',
        '--port',
        '0',
      ],
      { cwd: directory, stdio: ['ignore', 'pipe', 'pipe'] }
    );
    let output = '';
    child.stdout.on('data', chunk => (output += String(chunk)));
    child.stderr.on('data', chunk => (output += String(chunk)));
    let disposal: Promise<void> | undefined;
    const dispose = () => {
      disposal ??= (async () => {
        try {
          if (child.pid && child.exitCode === null && child.signalCode === null) {
            const exited = new Promise<void>(resolve =>
              child.once('exit', () => {
                resolve();
              })
            );
            child.kill();
            const timer = setTimeout(() => child.kill('SIGKILL'), 3000);
            await exited;
            clearTimeout(timer);
          }
        } finally {
          await rm(directory, { recursive: true, force: true });
        }
      })();
      return disposal;
    };
    try {
      const url = await new Promise<string>((resolve, reject) => {
        const timer = setTimeout(() => {
          cleanup();
          reject(new Error(`Wrangler did not start within 45 seconds\n${output}`));
        }, 45000);
        const cleanup = () => {
          clearTimeout(timer);
          child.stdout.off('data', ready);
          child.stderr.off('data', ready);
          child.off('error', failed);
          child.off('exit', exited);
          signal?.removeEventListener('abort', aborted);
        };
        const ready = () => {
          const match = output.match(/Ready on (http:\/\/127\.0\.0\.1:\d+)/);
          if (match) {
            cleanup();
            resolve(match[1]);
          }
        };
        const failed = (error: Error) => {
          cleanup();
          reject(error);
        };
        const aborted = () => {
          failed(signal?.reason ?? new Error('Gateway startup aborted'));
        };
        const exited = (code: number | null) => {
          failed(new Error(`Wrangler exited ${code}\n${output}`));
        };
        child.stdout.on('data', ready);
        child.stderr.on('data', ready);
        child.once('error', failed);
        child.once('exit', exited);
        signal?.addEventListener('abort', aborted, { once: true });
        if (signal?.aborted) {
          aborted();
        }
      });
      return { url, dispose };
    } catch (error) {
      await dispose();
      throw error;
    }
  } catch (error) {
    await rm(directory, { recursive: true, force: true });
    throw error;
  }
}
