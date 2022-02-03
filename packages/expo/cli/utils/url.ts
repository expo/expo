import dns from 'dns';
import fetch from 'node-fetch';

export function isUrlAvailableAsync(url: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    dns.lookup(url, (err) => {
      resolve(!err);
    });
  });
}

export function isUrl(str: string) {
  if (!str.startsWith('http://') && !str.startsWith('https://')) {
    return false;
  }

  return true;
}

export async function isUrlOk(url: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    return res.status === 200;
  } catch {
    return false;
  }
}
