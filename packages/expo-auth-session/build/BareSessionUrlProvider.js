import { Platform } from '@unimodules/core';
export class BareSessionUrlProvider {
    getDefaultReturnUrl() {
        throw new Error("No default return URL could be found. If you're using the bare workflow, please provide `options.returnUrl`.");
    }
    getStartUrl(authUrl, _returnUrl) {
        return authUrl;
    }
    getRedirectUrl(urlPath) {
        if (Platform.OS === 'web') {
            return [window.location.origin, urlPath].filter(Boolean).join('/');
        }
        throw new Error("No default redirect URL could be found. If you're using the bare workflow, you'll need to provide this yourself.");
    }
}
//# sourceMappingURL=BareSessionUrlProvider.js.map