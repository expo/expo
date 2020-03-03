export declare type LocalAuthenticationResult = {
    success: true;
} | {
    success: false;
    error: string;
};
export declare enum AuthenticationType {
    FINGERPRINT = 1,
    FACIAL_RECOGNITION = 2
}
export declare type LocalAuthenticationOptions = {
    promptMessage?: string;
    cancelLabel?: string;
    fallbackLabel?: string;
    disableDeviceFallback?: boolean;
};
