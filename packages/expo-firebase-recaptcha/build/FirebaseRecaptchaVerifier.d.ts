import { FirebaseAuthApplicationVerifier } from './FirebaseRecaptcha.types';
export default class FirebaseRecaptchaVerifier implements FirebaseAuthApplicationVerifier {
    private token;
    constructor(token: string);
    get type(): string;
    verify(): Promise<string>;
}
