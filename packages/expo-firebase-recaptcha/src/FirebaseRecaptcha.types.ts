export interface IFirebaseAuthApplicationVerifier {
  readonly type: string;
  verify(): Promise<string>;
}
