/// <reference types="jquery" />
import { ExpoRequestor } from './ExpoRequestor';
/**
 * Extends Requester
 */
export declare class ExpoTokenRequestor extends ExpoRequestor {
    xhr<T>(settings: JQueryAjaxSettings): Promise<T>;
}
