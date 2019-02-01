import { AuthCredential } from '../types';
export default class PhoneAuthProvider {
    constructor();
    static readonly PROVIDER_ID: string;
    static credential(verificationId: string, code: string): AuthCredential;
}
