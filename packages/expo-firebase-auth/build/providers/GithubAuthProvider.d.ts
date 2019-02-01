import { AuthCredential } from '../types';
export default class GithubAuthProvider {
    constructor();
    static readonly PROVIDER_ID: string;
    static credential(token: string): AuthCredential;
}
