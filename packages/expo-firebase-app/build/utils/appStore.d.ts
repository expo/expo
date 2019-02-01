import { App, FirebaseModule } from '../types';
export declare const APP_STORE: {
    [key: string]: App;
};
export declare const APP_MODULES: {
    [key: string]: {
        [key: string]: FirebaseModule;
    };
};
export declare const CUSTOM_URL_OR_REGION_NAMESPACES: {
    database: boolean;
    functions: boolean;
    storage: boolean;
    admob: boolean;
    analytics: boolean;
    auth: boolean;
    config: boolean;
    crashlytics: boolean;
    firestore: boolean;
    iid: boolean;
    invites: boolean;
    links: boolean;
    messaging: boolean;
    notifications: boolean;
    perf: boolean;
    utils: boolean;
};
