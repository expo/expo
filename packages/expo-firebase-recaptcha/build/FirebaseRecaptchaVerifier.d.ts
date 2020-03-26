import { IFirebaseAuthApplicationVerifier } from './FirebaseRecaptcha.types';
export default class FirebaseRecaptchaVerifier implements IFirebaseAuthApplicationVerifier {
    private token;
    constructor(token: string);
    get type(): string;
    verify(): Promise<string>;
}
