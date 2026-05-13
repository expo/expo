export type FetchTextAsync = (input: string, init?: RequestInit) => Promise<string>;

function defaultFetchTextAsync(input: string, init?: RequestInit): Promise<string> {
  return fetch(input, init).then((res) => res.text());
}

let fetchTextAsyncFn: FetchTextAsync = defaultFetchTextAsync;

export function setFetchText(fn: FetchTextAsync) {
  fetchTextAsyncFn = fn;
}

export function fetchTextAsync(input: string, init?: RequestInit): Promise<string> {
  return fetchTextAsyncFn(input, init);
}
