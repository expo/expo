export type FetchTextAsync = (
  input: string,
  init?: {
    method?: string;
    body?: string;
  }
) => Promise<string>;

function defaultFetchTextAsync(
  input: string,
  init?: {
    method?: string;
    body?: string;
  }
): Promise<string> {
  return fetch(input, init).then((res) => res.text());
}

let fetchTextAsyncFn: FetchTextAsync = defaultFetchTextAsync;

export function setFetchText(fn: FetchTextAsync) {
  fetchTextAsyncFn = fn;
}

export function fetchTextAsync(
  input: string,
  init?: { method?: string; body?: string }
): Promise<string> {
  return fetchTextAsyncFn(input, init);
}
