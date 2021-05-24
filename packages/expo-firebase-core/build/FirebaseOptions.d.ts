export declare type IFirebaseOptions = Partial<{
    appId: string;
    apiKey: string;
    databaseURL: string;
    trackingId: string;
    messagingSenderId: string;
    storageBucket: string;
    projectId: string;
    authDomain: string;
    measurementId: string;
}>;
export declare function getDefaultWebOptions(): IFirebaseOptions | void;
