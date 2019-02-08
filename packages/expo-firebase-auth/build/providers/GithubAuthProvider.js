import invariant from 'invariant';
const providerId = 'github.com';
export default class GithubAuthProvider {
    constructor() {
        throw new Error('`new GithubAuthProvider()` is not supported on the native Firebase SDKs.');
    }
    static get PROVIDER_ID() {
        return providerId;
    }
    static credential(token) {
        invariant(token, 'credential failed: expected 1 argument (the OAuth access token).');
        return {
            token,
            secret: '',
            providerId,
        };
    }
}
//# sourceMappingURL=GithubAuthProvider.js.map