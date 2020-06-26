export declare function generateRandomAsync(size: number): Promise<string>;
/**
 * Proof key for Code Exchange by OAuth Public Clients (RFC 7636), Section 4.1
 * [Section 4.1](https://tools.ietf.org/html/rfc7636#section-4.1)
 */
export declare function deriveChallengeAsync(code: string): Promise<string>;
export declare function buildCodeAsync(size?: number): Promise<{
    codeChallenge: string;
    codeVerifier: string;
}>;
/**
 * Digest a random string with hex encoding, useful for creating `nonce`s.
 */
export declare function generateHexStringAsync(size: number): Promise<string>;
