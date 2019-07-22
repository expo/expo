import { CodedError } from '@unimodules/core';
import { CryptoEncoding } from './Crypto.types';
export default {
    get name() {
        return 'ExpoCrypto';
    },
    async digestStringAsync(algorithm, data, options) {
        if (!crypto.subtle) {
            throw new CodedError('ERR_CRYPTO_UNAVAILABLE', 'Access to the WebCrypto API is restricted to secure origins (https).');
        }
        const encoder = new TextEncoder();
        const buffer = encoder.encode(data);
        const hashedData = await crypto.subtle.digest(algorithm, buffer);
        if (options.encoding === CryptoEncoding.HEX) {
            return hexString(hashedData);
        }
        else if (options.encoding === CryptoEncoding.BASE64) {
            return btoa(String.fromCharCode(...new Uint8Array(hashedData)));
        }
        throw new CodedError('ERR_CRYPTO_DIGEST', 'Invalid encoding type provided.');
    },
};
function hexString(buffer) {
    const byteArray = new Uint8Array(buffer);
    const hexCodes = [...byteArray].map(value => {
        const hexCode = value.toString(16);
        const paddedHexCode = hexCode.padStart(2, '0');
        return paddedHexCode;
    });
    return hexCodes.join('');
}
//# sourceMappingURL=ExpoCrypto.web.js.map