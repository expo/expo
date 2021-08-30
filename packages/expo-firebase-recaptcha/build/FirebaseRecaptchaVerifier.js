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