const providerId = 'twitter.com';
export default class TwitterAuthProvider {
    constructor() {
        throw new Error('`new TwitterAuthProvider()` is not supported on the native Firebase SDKs.');
    }
    static get PROVIDER_ID() {
        return providerId;
    }
    static credential(token, secret) {
        return {
            token,
            secret,
            providerId,
        };
    }
}
//# sourceMappingURL=TwitterAuthProvider.js.map