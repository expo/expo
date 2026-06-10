export type FetchTextAsync = (input: string, init?: RequestInit) => Promise<string>;
export declare function setFetchText(fn: FetchTextAsync): void;
export declare function fetchTextAsync(input: string, init?: RequestInit): Promise<string>;
