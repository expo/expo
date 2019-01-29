import { AuthCredential } from '../types';
export default class FacebookAuthProvider {
    constructor();
    static readonly PROVIDER_ID: string;
    static credential(token: string): AuthCredential;
}
