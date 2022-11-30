import dns from 'dns';
import { URL } from 'url';

import { fetchAsync } from '../api/rest/client';

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
    const res = await fetchAsync(url);
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

/** Remove the port from a given `host` URL string. */
export function stripPort(host?: string): string | null {
  return coerceUrl(host)?.hostname ?? null;
}

function coerceUrl(urlString?: string): URL | null {
  if (!urlString) {
    return null;
  }
  try {
    return new URL('/', urlString);
  } catch (error: any) {
    if (error.code !== 'ERR_INVALID_URL') {
      throw error;
    }
    return new URL('/', `http://${urlString}`);
  }
}

/** Strip a given extension from a URL string. */
export function stripExtension(url: string, extension: string): string {
  return url.replace(new RegExp(`.${extension}$`), '');
}
