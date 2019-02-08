import { App, ModuleBase } from 'expo-firebase-app';
export declare const MODULE_NAME = "ExpoFirebaseInstanceID";
export declare const NAMESPACE = "iid";
export declare const statics: {};
export default class InstanceId extends ModuleBase {
    static moduleName: string;
    static namespace: string;
    static statics: {};
    constructor(app: App);
    delete(): Promise<void>;
    get(): Promise<string>;
    _validateAuthorizedEntity: (token?: string | undefined) => string | undefined;
    _validateScope: (scope?: string | undefined) => string | undefined;
    getToken: (authorizedEntity?: string | undefined, scope?: string | undefined) => Promise<string>;
    deleteToken: (authorizedEntity?: string | undefined, scope?: string | undefined) => Promise<void>;
}
