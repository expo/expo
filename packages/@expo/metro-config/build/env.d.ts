declare class Env {
    /** Enable debug logging */
    get EXPO_DEBUG(): boolean;
    /** Enable the experimental "exotic" mode. [Learn more](https://blog.expo.dev/drastically-faster-bundling-in-react-native-a54f268e0ed1). */
    get EXPO_USE_EXOTIC(): boolean;
    /** The React Metro port that's baked into react-native scripts and tools. */
    get RCT_METRO_PORT(): number;
    /** Enable auto server root detection for Metro. This will change the server root to the workspace root. */
    get EXPO_USE_METRO_WORKSPACE_ROOT(): boolean;
    /** Disable Environment Variable injection in client bundles. */
    get EXPO_NO_CLIENT_ENV_VARS(): boolean;
}
export declare const env: Env;
export {};
