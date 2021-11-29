// see: https://github.com/firebase/firebase-js-sdk/blob/dbd54f7c9ef0b5d78d491e26d816084a478bdf04/packages/auth-types/index.d.ts#L142-L145
export interface FirebaseAuthApplicationVerifier {
  readonly type: string;
  verify(): Promise<string>;
}
