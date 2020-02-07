declare global {
    const __DEV__: boolean;
}
export declare type AuthSessionOptions = {
    authUrl: string;
    returnUrl?: string;
    showInRecents?: boolean;
};
export declare type AuthSessionResult = {
    type: 'cancel' | 'dismiss' | 'locked';
} | {
    type: 'error' | 'success';
    errorCode: string | null;
    params: {
        [key: string]: string;
    };
    url: string;
};
