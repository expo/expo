import { App, ModuleBase } from 'expo-firebase-app';
import { HttpsCallable, HttpsErrorCode } from './types.flow';
export declare const NAMESPACE = "functions";
export declare const MODULE_NAME = "ExpoFirebaseFunctions";
export declare const statics: {
    HttpsErrorCode: HttpsErrorCode;
};
export default class Functions extends ModuleBase {
    static moduleName: string;
    static namespace: string;
    static statics: {
        HttpsErrorCode: HttpsErrorCode;
    };
    constructor(appOrRegion: App, region?: string);
    /**
     * -------------
     *  PUBLIC API
     * -------------
     */
    /**
     * Returns a reference to the callable https trigger with the given name.
     * @param name The name of the trigger.
     */
    httpsCallable(name: string): HttpsCallable;
    /**
     * Changes this instance to point to a Cloud Functions emulator running
     * locally.
     *
     * See https://firebase.google.com/docs/functions/local-emulator
     *
     * @param origin the origin string of the local emulator started via firebase tools
     * "http://10.0.0.8:1337".
     */
    useFunctionsEmulator(origin: string): Promise<null>;
}
