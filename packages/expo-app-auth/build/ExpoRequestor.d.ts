/// <reference types="jquery" />
import { Requestor } from '@openid/appauth';
/**
 * Extends Requester
 */
export declare class ExpoRequestor extends Requestor {
    getJsonHeaders(): string;
    createRequest(settings: JQueryAjaxSettings): {
        init: RequestInit;
        url: URL;
        isJsonDataType: boolean;
    };
    xhr<T>(settings: JQueryAjaxSettings): Promise<T>;
}
