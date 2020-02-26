/// <reference types="jquery" />
import { Requestor } from '@openid/appauth';
/**
 * Extends Requester
 */
export declare class ExpoRequestor extends Requestor {
    xhr<T>(settings: JQueryAjaxSettings): Promise<T>;
}
