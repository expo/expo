// This is a replacement for the internal verifier in Firebase
// see: https://github.com/firebase/firebase-js-sdk/blob/cdada6c68f9740d13dd6674bcb658e28e68253b6/packages/auth/src/platform_browser/recaptcha/recaptcha_verifier.ts#L49-L279
export default class FirebaseRecaptchaVerifier {
    token;
    constructor(token) {
        this.token = token;
    }
    get type() {
        return 'recaptcha';
    }
    async verify() {
        return this.token;
    }
}
//# sourceMappingURL=FirebaseRecaptchaVerifier.js.map