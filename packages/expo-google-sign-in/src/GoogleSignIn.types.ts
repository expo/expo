import GoogleUser from './GoogleUser';

export type GoogleSignInType = 'default' | 'games';

export type GoogleSignInOptions = {
  scopes?: string[];
  webClientId?: string;
  hostedDomain?: string;
  accountName?: string;

  // Android
  signInType?: GoogleSignInType;
  isOfflineEnabled?: boolean;
  isPromptEnabled?: boolean;
  // iOS
  clientId?: string;
  language?: string;
  openIdRealm?: string;
};

export type GoogleSignInAuthResultType = 'success' | 'cancel';

export type GoogleSignInAuthResult = {
  type: GoogleSignInAuthResultType;
  user?: GoogleUser | null;
};
