export declare class MetroServerError extends Error {
    url: string;
    code: string;
    constructor(errorObject: {
        message: string;
    } & Record<string, any>, url: string);
}
//# sourceMappingURL=errors.d.ts.map