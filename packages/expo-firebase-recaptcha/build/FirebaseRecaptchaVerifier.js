export default class FirebaseRecaptchaVerifier {
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