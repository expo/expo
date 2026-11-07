import { execFile, spawnSync } from 'child_process';

import type { CertificateData } from './parser';

const options = {
  encoding: 'utf8' as const,
  timeout: 30000,
  maxBuffer: 64 * 1024 * 1024,
  windowsHide: true,
};

function args(legacy: boolean): string[] {
  return [...(legacy ? ['--openssl-legacy-provider'] : []), require.resolve('./worker')];
}

function receive(stdout: string): CertificateData[] {
  const result = JSON.parse(stdout) as { certificates?: CertificateData[]; error?: string };
  if (result.error) throw new Error(result.error);
  if (!Array.isArray(result.certificates))
    throw new Error('PKCS12: invalid parser subprocess response');
  return result.certificates;
}

export function parseInSubprocessSync(bytes: Buffer, password: string): CertificateData[] {
  const child = spawnSync(process.execPath, args(false), {
    ...options,
    input: JSON.stringify({ data: bytes.toString('base64'), password }),
  });
  if (child.error || child.status !== 0) {
    throw new Error(
      `PKCS12: parser subprocess failed (${child.error?.message ?? `exit ${child.status}`})`
    );
  }
  return receive(child.stdout);
}

export function parseInSubprocess(bytes: Buffer, password: string): Promise<CertificateData[]> {
  return new Promise((resolve, reject) => {
    const child = execFile(process.execPath, args(true), options, (error, stdout) => {
      if (error) {
        reject(
          new Error(
            `PKCS12: the legacy parser subprocess failed (${error.message}). Check the Node.js executable and its OpenSSL legacy provider support.`
          )
        );
        return;
      }
      try {
        resolve(receive(stdout));
      } catch (error) {
        reject(error);
      }
    });
    // The process callback reports early exits
    child.stdin!.on('error', () => {});
    child.stdin!.end(JSON.stringify({ data: bytes.toString('base64'), password }));
  });
}
