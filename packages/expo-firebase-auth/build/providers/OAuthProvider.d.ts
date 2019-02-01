import { AuthCredential } from '../types';
export default class OAuthProvider {
    constructor();
    static readonly PROVIDER_ID: string;
    static credential(idToken: string, accessToken: string): AuthCredential;
}
