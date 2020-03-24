import GoogleUser from './GoogleUser';

export type GoogleSignInType = 'default' | 'games';

export type GoogleSignInOptions = {
  scopes?: string[];
  webClientId?: string;
  hostedDomain?: string;
  /**
   * If the user's email address is known ahead of time, it can be supplied to be the default option.
   * If the user has approved access for this app in the past then auth may return without any further interaction.
   */
  accountName?: string;
  // Android
  signInType?: GoogleSignInType;
  isOfflineEnabled?: boolean;
  isPromptEnabled?: boolean;
  // iOS
  clientId?: string;
  /**
   * Language for the sign in UI, in the form of ISO 639-1 language code optionally followed by a dash
   * and ISO 3166-1 alpha-2 region code, such as 'it' or 'pt-PT'.
   * Only set this value if it's different from the system default (which you can access via expo-localization).
   */
  language?: string;
  openIdRealm?: string;
};

export type GoogleSignInAuthResultType = 'success' | 'cancel';

export type GoogleSignInAuthResult = {
  type: GoogleSignInAuthResultType;
  user?: GoogleUser | null;
};
