declare const Response: {
    prototype: Response;
    new (body?: BodyInit | null, init?: ResponseInit): Response;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Response/error_static) */
    error(): Response;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Response/json_static) */
    json(data: any, init?: ResponseInit): Response;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Response/redirect_static) */
    redirect(url: string | URL, status?: number): Response;
};
declare global {
    /** @deprecated */
    var ExpoRequest: typeof Request;
    /** @deprecated */
    var ExpoResponse: typeof Response;
}
/** @deprecated */
export declare const ExpoRequest: {
    new (input: URL | RequestInfo, init?: RequestInit | undefined): Request;
    prototype: Request;
};
/** @deprecated */
export declare const ExpoResponse: {
    new (input: URL | RequestInfo, init?: RequestInit | undefined): Request;
    prototype: Request;
};
export declare function installGlobals(): void;
export {};
