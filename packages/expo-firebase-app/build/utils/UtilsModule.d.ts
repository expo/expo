import ModuleBase from './ModuleBase';
import App from '../app';
declare type GoogleApiAvailabilityType = {
    status: number;
    isAvailable: boolean;
    isUserResolvableError?: boolean;
    hasResolution?: boolean;
    error?: string;
};
export declare const MODULE_NAME = "ExpoFirebaseUtils";
export declare const NAMESPACE = "utils";
export declare const statics: {};
export declare class ExpoFirebaseUtils extends ModuleBase {
    static namespace: string;
    static moduleName: string;
    static statics: {};
    constructor(app: App);
    /**
     *
     */
    checkPlayServicesAvailability(): void;
    getPlayServicesStatus(): Promise<GoogleApiAvailabilityType | null>;
    promptForPlayServices(): Promise<any | null>;
    resolutionForPlayServices(): Promise<any | null>;
    makePlayServicesAvailable(): Promise<any | null>;
    /**
     * Set the global logging level for all logs.
     *
     * @param logLevel
     */
    logLevel: string;
    /**
     * Returns props from the android GoogleApiAvailability sdk
     * @android
     * @return {ExpoFirebaseApp.GoogleApiAvailabilityType|{isAvailable: boolean, status: number}}
     */
    readonly playServicesAvailability: GoogleApiAvailabilityType;
    /**
     * Enable/Disable throwing an error or warning on detecting a play services problem
     * @android
     * @param bool
     */
    errorOnMissingPlayServices: boolean;
    /**
     * Enable/Disable automatic prompting of the play services update dialog
     * @android
     * @param bool
     */
    promptOnMissingPlayServices: boolean;
}
export default ExpoFirebaseUtils;
