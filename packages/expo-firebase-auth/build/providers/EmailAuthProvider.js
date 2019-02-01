const linkProviderId = 'emailLink';
const passwordProviderId = 'password';
export default class EmailAuthProvider {
    constructor() {
        throw new Error('`new EmailAuthProvider()` is not supported on the native Firebase SDKs.');
    }
    static get EMAIL_LINK_SIGN_IN_METHOD() {
        return linkProviderId;
    }
    static get EMAIL_PASSWORD_SIGN_IN_METHOD() {
        return passwordProviderId;
    }
    static get PROVIDER_ID() {
        return passwordProviderId;
    }
    static credential(email, password) {
        return {
            token: email,
            secret: password,
            providerId: passwordProviderId,
        };
    }
    /**
     * Initialize an EmailAuthProvider credential using an email and an email link after a sign in with email link operation.
     * @param email Email address.
     * @param emailLink Sign-in email link.
     * @returns {{token: string, secret: string, providerId: string}}
     */
    static credentialWithLink(email, emailLink) {
        return {
            token: email,
            secret: emailLink,
            providerId: linkProviderId,
        };
    }
}
//# sourceMappingURL=EmailAuthProvider.js.map