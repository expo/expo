import { SessionUrlProvider } from './SessionUrlProvider';

export class BareSessionUrlProvider implements SessionUrlProvider {
  getDefaultReturnUrl(): string {
    throw new Error(
      'You are using bare workflow which does not support `default return url`. You need to provide the return url.'
    );
  }

  getStartUrl(authUrl: string, _returnUrl: string): string {
    return authUrl;
  }

  getRedirectUrl(): string {
    throw new Error('You need to provide redirect url.');
  }
}
