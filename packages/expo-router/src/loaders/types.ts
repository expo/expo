export type LoaderFetcher = (path: string, init: RequestInit) => Promise<unknown>;
export type LoaderResult = { data: unknown } | { error: unknown };
