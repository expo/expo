export declare enum AppOwnership {
    Standalone = "standalone",
    Expo = "expo",
    Guest = "guest"
}
export declare enum UserInterfaceIdiom {
    Handset = "handset",
    Tablet = "tablet",
    Unsupported = "unsupported"
}
export interface IOSManifest {
    buildNumber: string;
    platform: string;
    model: string;
    userInterfaceIdiom: UserInterfaceIdiom;
    systemVersion: string;
    [key: string]: any;
}
export interface AndroidManifest {
    versionCode: number;
    [key: string]: any;
}
export interface WebManifest {
    [key: string]: any;
}
export interface AppManifest {
    name?: string;
    description?: string;
    slug?: string;
    sdkVersion?: string;
    version?: string;
    orientation?: string;
    primaryColor?: string;
    icon?: string;
    notification?: {
        icon?: string;
        color?: string;
        [key: string]: any;
    };
    loading?: {
        icon?: string;
        [key: string]: any;
    };
    entryPoint?: string;
    packagerOpts?: {
        hostType?: string;
        dev?: boolean;
        strict?: boolean;
        minify?: boolean;
        urlType?: string;
        urlRandomness?: string;
        lanType?: string;
        [key: string]: any;
    };
    xde?: boolean;
    developer?: {
        tool?: string;
        [key: string]: any;
    };
    bundleUrl: string;
    debuggerHost?: string;
    mainModuleName?: string;
    logUrl?: string;
    [key: string]: any;
}
export interface PlatformManifest {
    ios?: IOSManifest;
    android?: AndroidManifest;
    web?: WebManifest;
    detach?: {
        scheme?: string;
        [key: string]: any;
    };
    logUrl?: string;
    scheme?: string;
    hostUri?: string;
    developer?: string;
    [key: string]: any;
}
export interface NativeConstants {
    name: 'ExponentConstants';
    appOwnership: AppOwnership;
    debugMode: boolean;
    deviceName?: string;
    deviceYearClass: number | null;
    experienceUrl: string;
    expoRuntimeVersion: string;
    expoVersion: string;
    isDetached?: boolean;
    intentUri?: string;
    installationId: string;
    isDevice: boolean;
    isHeadless: boolean;
    linkingUri: string;
    nativeAppVersion: null;
    nativeBuildVersion: null;
    manifest: AppManifest;
    sessionId: string;
    statusBarHeight: number;
    systemFonts: string[];
    systemVersion?: number;
    platform?: PlatformManifest;
    [key: string]: any;
    getWebViewUserAgentAsync: () => Promise<string | null>;
}
