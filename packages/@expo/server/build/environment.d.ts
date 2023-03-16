import { Response, Request } from '@remix-run/node';
export declare function installGlobals(): void;
export declare class ExpoResponse extends Response {
    static json(data?: any, init?: ResponseInit): ExpoResponse;
}
export declare class ExpoRequest extends Request {
}
