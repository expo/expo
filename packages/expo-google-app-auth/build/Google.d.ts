export declare type GoogleLogInConfig = {
    androidClientId?: string;
    iosClientId?: string;
    androidStandaloneAppClientId?: string;
    iosStandaloneAppClientId?: string;
    /** Deprecated: You will need to use expo-google-sign-in to do server side authentication outside of the Expo client */
    webClientId?: string;
    /**
     * System authentication is very different from web auth.
     * All system functionality has been moved to expo-google-sign-in
     */
    behavior?: 'system' | 'web';
    scopes?: string[];
    /**
     * Optionally you can define your own redirect URL.
     * If this isn't defined then it will be infered from the correct client ID.
     */
    redirectUrl: string;
    /**
     * Language for the sign in UI, in the form of ISO 639-1 language code optionally followed by a dash
     * and ISO 3166-1 alpha-2 region code, such as 'it' or 'pt-PT'.
     * Only set this value if it's different from the system default (which you can access via expo-localization).
     */
    language?: string;
    /**
     * If the user's email address is known ahead of time, it can be supplied to be the default option.
     * If the user has approved access for this app in the past then auth may return without any further interaction.
     */
    accountName?: string;
    clientId?: string;
};
export declare type GoogleUser = {
    id?: string;
    name?: string;
    givenName?: string;
    familyName?: string;
    photoUrl?: string;
    email?: string;
};
export declare type LogInResult = {
    type: 'cancel';
} | {
    type: 'success';
    accessToken: string | null;
    idToken: string | null;
    refreshToken: string | null;
    user: GoogleUser;
};
export declare function logInAsync(config: GoogleLogInConfig): Promise<LogInResult>;
export declare function logOutAsync({ accessToken, ...inputConfig }: GoogleLogInConfig & {
    accessToken: string;
}): Promise<any>;
