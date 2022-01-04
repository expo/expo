export declare type FirebaseOptions = {
    /**
     * Unique identifier of the Firebase app.
     */
    appId?: string;
    /**
     * Firebase API key.
     */
    apiKey?: string;
    /**
     * Firebase database URL.
     */
    databaseURL?: string;
    /**
     * Tracking identifier for Google Analytics.
     */
    trackingId?: string;
    messagingSenderId?: string;
    /**
     * Google Cloud Storage bucket name.
     */
    storageBucket?: string;
    /**
     * Unique identifier of the Firebase project.
     */
    projectId?: string;
    authDomain?: string;
    measurementId?: string;
};
export declare function getDefaultWebOptions(): FirebaseOptions | void;
//# sourceMappingURL=FirebaseOptions.d.ts.map