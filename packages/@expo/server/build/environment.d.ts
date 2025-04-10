import './assertion';
import type * as undici from 'undici';
declare global {
    interface RequestInit extends undici.RequestInit {
        duplex?: 'half';
    }
    interface Request extends undici.Request {
    }
    var Request: typeof Request;
    interface Response extends undici.Response {
    }
    var Response: typeof Response;
    interface Headers extends undici.Headers {
    }
    var Headers: typeof Headers;
    interface File extends undici.File {
    }
    var File: typeof File;
    interface Headers extends undici.Headers {
    }
    var Headers: typeof Headers;
    interface FormData extends undici.FormData {
    }
    var FormData: typeof FormData;
    /** @deprecated */
    var ExpoRequest: typeof Request;
    /** @deprecated */
    var ExpoResponse: typeof Response;
}
/** @deprecated */
export declare const ExpoRequest: {
    new (input: RequestInfo | URL, init?: RequestInit): Request;
    prototype: Request;
};
/** @deprecated */
export declare const ExpoResponse: {
    new (body?: BodyInit | null, init?: ResponseInit): Response;
    prototype: Response;
    error(): Response;
    json(data: any, init?: ResponseInit): Response;
    redirect(url: string | URL, status?: number): Response;
};
/** Use global polyfills from undici */
export declare function installGlobals(): void;
