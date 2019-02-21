import { AuthCredential } from '../types';
export default class TwitterAuthProvider {
    constructor();
    static readonly PROVIDER_ID: string;
    static credential(token: string, secret: string): AuthCredential;
}
