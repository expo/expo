import { AuthError } from './Errors';

export type AuthSessionOptions = {
  authUrl: string;
  returnUrl?: string;
  showInRecents?: boolean;
};

export type AuthSessionResult =
  | { type: 'cancel' | 'dismiss' | 'locked' }
  | {
      type: 'error' | 'success';
      errorCode: string | null;
      error?: AuthError | null;
      params: { [key: string]: string };
      url: string;
    };
