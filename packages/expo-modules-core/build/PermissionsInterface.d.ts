export declare enum PermissionStatus {
    GRANTED = "granted",
    UNDETERMINED = "undetermined",
    DENIED = "denied"
}
export declare type PermissionExpiration = 'never' | number;
export interface PermissionResponse {
    status: PermissionStatus;
    expires: PermissionExpiration;
    granted: boolean;
    canAskAgain: boolean;
}
