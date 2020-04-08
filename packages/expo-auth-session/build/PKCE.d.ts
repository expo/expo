export declare function generateRandomAsync(size: number): Promise<string>;
export declare function buildCodeAsync(size?: number): Promise<{
    codeChallenge: string;
    codeVerifier: string;
}>;
