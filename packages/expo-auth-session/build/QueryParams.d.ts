export declare function buildQueryString(input: Record<string, string>): string;
export declare function getQueryParams(url: string): {
    errorCode: string | null;
    params: {
        [key: string]: string;
    };
};
