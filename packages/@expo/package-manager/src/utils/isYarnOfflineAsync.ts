import { execSync } from 'child_process';
import dns from 'dns';
import url from 'url';

export function getNpmProxy(): string | null {
  if (process.env.https_proxy) {
    return process.env.https_proxy ?? null;
  }

  try {
    const httpsProxy = execSync('npm config get https-proxy').toString().trim();
    return httpsProxy !== 'null' ? httpsProxy : null;
  } catch {
    return null;
  }
}

function isUrlAvailableAsync(url: string): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    dns.lookup(url, err => {
      resolve(!err);
    });
  });
}

/**
 * Determine if you should use yarn offline or not.
 */
export default async function isYarnOfflineAsync(): Promise<boolean> {
  if (await isUrlAvailableAsync('registry.yarnpkg.com')) {
    return false;
  }

  const proxy = getNpmProxy();

  if (!proxy) {
    return true;
  }

  const { hostname } = url.parse(proxy);
  if (!hostname) {
    return true;
  }

  return !(await isUrlAvailableAsync(hostname));
}
