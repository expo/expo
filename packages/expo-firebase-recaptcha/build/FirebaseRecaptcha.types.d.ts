export interface FirebaseAuthApplicationVerifier {
    readonly type: string;
    verify(): Promise<string>;
}
