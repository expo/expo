export declare function generateKey(): Promise<string>;
export declare function attestKey(key: string, challenge: string): Promise<string>;
export declare function generateAssertion(key: string, json: string): Promise<string>;
export declare function requestIntegrityCheck(challenge: string): Promise<string>;
export declare function prepareIntegrityTokenProvider(cloudProjectNumber: string): Promise<void>;
//# sourceMappingURL=AppIntegrity.d.ts.map