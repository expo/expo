export interface IFirebaseOptions {
    appId: string;
    apiKey: string;
    databaseURL: string;
    trackingId: string;
    messagingSenderId: string;
    storageBucket: string;
    projectId: string;
    authDomain: string;
}
export declare class FirebaseOptions {
    static parseAndroidGoogleServices(json: any): IFirebaseOptions;
}
