import GoogleUser from './GoogleUser';
export declare type GoogleSignInType = 'default' | 'games';
export declare type GoogleSignInOptions = {
    scopes?: string[];
    webClientId?: string;
    hostedDomain?: string;
    accountName?: string;
    signInType?: GoogleSignInType;
    isOfflineEnabled?: boolean;
    isPromptEnabled?: boolean;
    clientId?: string;
    language?: string;
    openIdRealm?: string;
};
export declare type GoogleSignInAuthResultType = 'success' | 'cancel';
export declare type GoogleSignInAuthResult = {
    type: GoogleSignInAuthResultType;
    user?: GoogleUser | null;
};
