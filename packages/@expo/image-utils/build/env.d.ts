declare class Env {
    /** Enable image utils related debugging messages */
    get EXPO_IMAGE_UTILS_DEBUG(): boolean;
    /** Disable all Sharp related functionality. */
    get EXPO_IMAGE_UTILS_NO_SHARP(): boolean;
}
export declare const env: Env;
export {};
