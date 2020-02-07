export class BareSessionUrlProvider {
    getDefaultReturnUrl() {
        throw new Error('You are using bare workflow which does not support `default return url`. You need to provide the return url.');
    }
    getStartUrl(authUrl, _returnUrl) {
        return authUrl;
    }
    getRedirectUrl() {
        throw new Error('You need to provide redirect url.');
    }
}
//# sourceMappingURL=BareSessionUrlProvider.js.map