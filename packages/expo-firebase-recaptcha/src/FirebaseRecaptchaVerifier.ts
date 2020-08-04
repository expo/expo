import { FirebaseAuthApplicationVerifier } from './FirebaseRecaptcha.types';

export default class FirebaseRecaptchaVerifier implements FirebaseAuthApplicationVerifier {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  get type(): string {
    return 'recaptcha';
  }

  async verify(): Promise<string> {
    return this.token;
  }
}
