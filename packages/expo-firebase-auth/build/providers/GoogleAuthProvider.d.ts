import { AuthCredential } from '../types';
export default class GoogleAuthProvider {
    constructor();
    static readonly PROVIDER_ID: string;
    static credential(token: string, secret: string): AuthCredential;
}
