export type Headers = Record<string, string> & {
  'Content-Type': string;
  Authorization?: string;
  Accept?: string;
};

export type FetchRequest = {
  headers?: Headers;
  body?: Record<string, string>;
  dataType?: string;
  method?: string;
};

export async function requestAsync<T>(requestUrl: string, fetchRequest: FetchRequest): Promise<T> {
  const url = new URL(requestUrl);

  const headers: Record<string, string> = {};
  const request: RequestInit = {
    body: undefined,
    method: fetchRequest.method,
    mode: 'cors',
    headers,
  };

  const isJsonDataType = fetchRequest.dataType?.toLowerCase() === 'json';

  if (fetchRequest.headers) {
    for (const i in fetchRequest.headers) {
      if (i in fetchRequest.headers) {
        const header = fetchRequest.headers[i];

        if (header != null) {
          headers[i] = header;
        }
      }
    }
  }

  if (fetchRequest.body) {
    if (fetchRequest.method?.toUpperCase() === 'POST') {
      request.body = new URLSearchParams(fetchRequest.body).toString();
    } else {
      for (const [key, value] of Object.entries(fetchRequest.body)) {
        url.searchParams.append(key, value);
      }
    }
  }

  if (isJsonDataType && !headers.Accept && !headers.accept) {
    // NOTE: Github authentication will return XML if this includes the standard `*/*`
    headers['Accept'] = 'application/json, text/javascript; q=0.01';
  }

  // Fix a problem with React Native `URL` causing a trailing slash to be added.
  const correctedUrl = url.toString().replace(/\/$/, '');

  const response = await fetch(correctedUrl, request);

  // Check for HTTP errors before attempting to parse the body.
  // Without this, a non-2xx response with an empty or non-JSON body would throw
  // an opaque SyntaxError from JSON.parse, hiding the actual HTTP error.
  // See: https://github.com/expo/expo/issues/45384
  if (!response.ok) {
    const bodyText = await response.text().catch(() => '');
    const contentType = response.headers.get('content-type');
    // If the error response is JSON, try to parse it and return it so callers
    // (like TokenRequest.performAsync) can inspect the `error` field.
    if (contentType?.includes('application/json') && bodyText) {
      try {
        return JSON.parse(bodyText);
      } catch {
        // Fall through to throw a descriptive error
      }
    }
    // For non-JSON error responses or empty bodies, throw a clear error
    const statusText = response.statusText || 'Unknown';
    throw new Error(
      `Request to ${correctedUrl} failed with status ${response.status} (${statusText})${bodyText ? `: ${bodyText}` : ''}`
    );
  }

  const contentType = response.headers.get('content-type');
  if (isJsonDataType || contentType?.includes('application/json')) {
    return response.json();
  }
  // @ts-ignore: Type 'string' is not assignable to type 'T'.
  return response.text();
}
