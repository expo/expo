import { stripAnsi } from '../../../utils/ansi';

export class MetroNodeError extends Error {
  constructor(
    message: string,
    public rawObject: any
  ) {
    super(message);
  }
}

/** Disable TLS rejection when fetching from the dev server to support `--https`. */
export async function fetchFromMetroAsync(url: string) {
  const res = await fetchConfidentAsync(url);

  // TODO: Improve error handling
  if (res.status === 500) {
    const text = await res.text();
    if (text.startsWith('{"originModulePath"') || text.startsWith('{"type":"TransformError"')) {
      const errorObject = JSON.parse(text);

      throw new MetroNodeError(stripAnsi(errorObject.message) ?? errorObject.message, errorObject);
    }
    throw new Error(`[${res.status}]: ${res.statusText}\n${text}`);
  }

  return res;
}

/** Disable TLS rejection when fetching from the dev server to support `--https`. */
export async function fetchConfidentAsync(url: string) {
  if (url.startsWith('http://')) {
    return fetch(url);
  }
  const originalNodeTLSRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    return await fetch(url);
  } finally {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalNodeTLSRejectUnauthorized;
  }
}
