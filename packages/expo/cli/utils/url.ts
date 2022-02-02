import dns from 'dns';
import fetch from 'node-fetch';
import { URL } from 'url';

export function isUrlAvailableAsync(url: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    dns.lookup(url, (err) => {
      resolve(!err);
    });
  });
}

export function isUrl(str: string) {
  return !!/^https?:\/\//.test(str);
}

export async function isUrlOk(url: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    return res.status === 200;
  } catch {
    return false;
  }
}

export function stripPort(host: string | undefined): string | undefined {
  if (!host) {
    return host;
  }
  return new URL('/', `http://${host}`).hostname;
}

export function isHttps(urlString: string): boolean {
  return validateUrl(urlString, { protocols: ['https'] });
}

export function validateUrl(
  urlString: string,
  { protocols, requireProtocol }: { protocols?: string[]; requireProtocol?: boolean }
) {
  const url = require('url');
  try {
    // eslint-disable-next-line
    new url.URL(urlString);
    const parsed = url.parse(urlString);
    if (!parsed.protocol && !requireProtocol) {
      return true;
    }
    return protocols
      ? parsed.protocol
        ? protocols.map((x) => `${x.toLowerCase()}:`).includes(parsed.protocol)
        : false
      : true;
  } catch (err) {
    return false;
  }
}
