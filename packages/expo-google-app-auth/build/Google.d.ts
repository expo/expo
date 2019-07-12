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
    redirectUrl?: string;
    clientId: string;
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
