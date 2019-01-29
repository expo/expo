import { AuthCredential } from '../types';
export default class EmailAuthProvider {
    constructor();
    static readonly EMAIL_LINK_SIGN_IN_METHOD: string;
    static readonly EMAIL_PASSWORD_SIGN_IN_METHOD: string;
    static readonly PROVIDER_ID: string;
    static credential(email: string, password: string): AuthCredential;
    /**
     * Initialize an EmailAuthProvider credential using an email and an email link after a sign in with email link operation.
     * @param email Email address.
     * @param emailLink Sign-in email link.
     * @returns {{token: string, secret: string, providerId: string}}
     */
    static credentialWithLink(email: string, emailLink: string): AuthCredential;
}
