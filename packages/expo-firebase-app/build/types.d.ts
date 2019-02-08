export declare type FirebaseError = {
    message: string;
    name: string;
    code: string;
    stack: string;
    path: string;
    details: string;
    modifiers: string;
};
export declare type FirebaseModule = any;
export declare type FirebaseModuleConfig = {
    statics?: any;
    events?: string[];
    moduleName: FirebaseModuleName;
    hasMultiAppSupport: boolean;
    hasCustomUrlSupport?: boolean;
    hasRegionsSupport?: boolean;
    namespace: FirebaseNamespace;
};
export declare type App = any;
export declare type FirebaseModuleName = 'ExpoFirebaseAdMob' | 'ExpoFirebaseAnalytics' | 'ExpoFirebaseAuth' | 'ExpoFirebaseRemoteConfig' | 'ExpoFirebaseCrash' | 'ExpoFirebaseCrashlytics' | 'ExpoFirebaseDatabase' | 'ExpoFirebaseFirestore' | 'ExpoFirebaseFunctions' | 'ExpoFirebaseInstanceID' | 'ExpoFirebaseInvites' | 'ExpoFirebaseLinks' | 'ExpoFirebaseMessaging' | 'ExpoFirebaseNotifications' | 'ExpoFirebasePerformance' | 'ExpoFirebaseStorage' | 'ExpoFirebaseUtils';
export declare type FirebaseNamespace = 'analytics' | 'auth' | 'config' | 'crashlytics' | 'database' | 'firestore' | 'functions' | 'iid' | 'invites' | 'links' | 'messaging' | 'notifications' | 'perf' | 'storage' | 'utils';
export declare type FirebaseOptions = {
    apiKey: string;
    appId: string;
    databaseURL: string;
    messagingSenderId: string;
    projectId: string;
    storageBucket: string;
};
export declare type FirebaseModuleAndStatics<FirebaseModule, FirebaseStatics> = {
    (): FirebaseModule;
    nativeModuleExists: boolean;
} & FirebaseStatics;
export declare type FirebaseStatics = any;
export declare type NativeErrorObject = {
    code: string;
    message: string;
    nativeErrorCode?: string | number;
    nativeErrorMessage?: string;
};
export declare type NativeErrorResponse = {
    error: NativeErrorObject;
    [key: string]: any;
};
export interface NativeErrorInterface extends Error {
    code: string;
    nativeErrorCode?: string | number;
    nativeErrorMessage?: string;
}
