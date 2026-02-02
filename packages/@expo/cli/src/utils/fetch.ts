import {
  fetch,
  Blob,
  URL,
  URLSearchParams,
  Request,
  Response,
  Headers,
  FormData,
} from 'fetch-nodeshim';

// NOTE(@kitten): Protect against accidental use of globals that don't match `fetch-nodeshim`
Object.assign(globalThis, {
  fetch,
  Blob,
  URL,
  URLSearchParams,
  Request,
  Response,
  Headers,
  FormData,
});

export { fetch, Headers, Response };
