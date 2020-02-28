import { SessionUrlProvider } from './SessionUrlProvider';

export class BareSessionUrlProvider implements SessionUrlProvider {
  getDefaultReturnUrl(): string {
    throw new Error(
      "No default return URL could be found. If you're using the bare workflow, please provide `options.returnUrl`."
    );
  }

  getStartUrl(authUrl: string, _returnUrl: string): string {
    return authUrl;
  }

  getRedirectUrl(): string {
    throw new Error(
      "No default redirect URL could be found. If you're using the bare workflow, you'll need to provide this yourself."
    );
  }
}
