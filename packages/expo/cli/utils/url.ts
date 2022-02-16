import dns from 'dns';
import fetch from 'node-fetch';
import { URL } from 'url';

/** Check if a server is available based on the URL. */
export function isUrlAvailableAsync(url: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    dns.lookup(url, (err) => {
      resolve(!err);
    });
  });
}

/** Check if a request to the given URL is `ok` (status 200). */
export async function isUrlOk(url: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    return res.ok;
  } catch {
    return false;
  }
}

/** Determine if a string is a valid URL, can optionally ensure certain protocols (like `https` or `exp`) are adhered to. */
export function validateUrl(
  urlString: string,
  {
    protocols,
    requireProtocol,
  }: {
    /** Set of allowed protocols for the string to adhere to. @example ['exp', 'https'] */
    protocols?: string[];
    /** Ensure the URL has a protocol component (prefix before `://`). */
    requireProtocol?: boolean;
  } = {}
) {
  try {
    const results = new URL(urlString);
    if (!results.protocol && !requireProtocol) {
      return true;
    }
    return protocols
      ? results.protocol
        ? protocols.map((x) => `${x.toLowerCase()}:`).includes(results.protocol)
        : false
      : true;
  } catch {
    return false;
  }
}

export function stripPort(host?: string): string | undefined {
  if (!host) {
    return host;
  }
  return new URL('/', `http://${host}`).hostname;
}

export function stripExtension(url: string, extension: string): string {
  return url.replace(new RegExp(`.${extension}$`), '');
}
