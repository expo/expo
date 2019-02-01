const providerId = 'phone';
export default class PhoneAuthProvider {
    constructor() {
        throw new Error('`new PhoneAuthProvider()` is not supported on the native Firebase SDKs.');
    }
    static get PROVIDER_ID() {
        return providerId;
    }
    static credential(verificationId, code) {
        return {
            token: verificationId,
            secret: code,
            providerId,
        };
    }
}
//# sourceMappingURL=PhoneAuthProvider.js.map