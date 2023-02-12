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
export declare function requestAsync<T>(requestUrl: string, fetchRequest: FetchRequest): Promise<T>;
//# sourceMappingURL=Fetch.d.ts.map