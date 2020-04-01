import { Crypto } from '@openid/appauth';
export declare function encodeBase64NoWrap(input: string): string;
export declare function bufferToString(buffer: Uint8Array, charset?: string): string;
export declare function urlSafe(b64: string): string;
/**
 * Extension of the default implementation of the `Crypto` interface.
 * This uses the capabilities of the native platform via Expo Unimodules.
 */
export declare class ExpoCrypto implements Crypto {
    generateRandom(size: number): Promise<string>;
    /**
     * Compute the SHA256 of a given code.
     * This is useful when using PKCE.
     * Proof key for Code Exchange by OAuth Public Clients (RFC 7636), Section 4.1
     * https://tools.ietf.org/html/rfc7636#section-4.1
     */
    deriveChallenge(code: string): Promise<string>;
}
