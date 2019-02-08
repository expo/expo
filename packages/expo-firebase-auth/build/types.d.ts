import User from './User';
export declare type IdTokenResult = {
    token: string;
    authTime: string;
    issuedAtTime: string;
    expirationTime: string;
    signInProvider: null | string;
    claims: {
        [key: string]: any;
    };
};
export declare type ActionCodeInfo = {
    data: {
        email?: string;
        fromEmail?: string;
    };
    operation: 'PASSWORD_RESET' | 'VERIFY_EMAIL' | 'RECOVER_EMAIL';
};
export declare type ActionCodeSettings = {
    android: {
        installApp?: boolean;
        minimumVersion?: string;
        packageName: string;
    };
    handleCodeInApp?: boolean;
    iOS: {
        bundleId?: string;
    };
    url: string;
};
export declare type AdditionalUserInfo = {
    isNewUser: boolean;
    profile?: Object;
    providerId: string;
    username?: string;
};
export declare type AuthCredential = {
    providerId: string;
    token: string;
    secret: string;
};
export declare type UserCredential = {
    additionalUserInfo?: AdditionalUserInfo;
    user: User;
};
export declare type UserInfo = {
    displayName?: string;
    email?: string;
    phoneNumber?: string;
    photoURL?: string;
    providerId: string;
    uid: string;
};
export declare type UserMetadata = {
    creationTime?: string;
    lastSignInTime?: string;
};
export declare type NativeUser = {
    displayName?: string;
    email?: string;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    metadata: UserMetadata;
    phoneNumber?: string;
    photoURL?: string;
    providerData: UserInfo[];
    providerId: string;
    uid: string;
};
export declare type NativeUserCredential = {
    additionalUserInfo?: AdditionalUserInfo;
    user: NativeUser;
};
