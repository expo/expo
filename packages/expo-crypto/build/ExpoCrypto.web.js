import { CodedError } from 'expo-modules-core';
import { CryptoEncoding } from './Crypto.types';
const getCrypto = () => window.crypto ?? window.msCrypto;
export default {
    async digestStringAsync(algorithm, data, options) {
        if (!crypto.subtle) {
            throw new CodedError('ERR_CRYPTO_UNAVAILABLE', 'Access to the WebCrypto API is restricted to secure origins (localhost/https).');
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
    getRandomBytes(length) {
        const array = new Uint8Array(length);
        return getCrypto().getRandomValues(array);
    },
    async getRandomBytesAsync(length) {
        const array = new Uint8Array(length);
        return getCrypto().getRandomValues(array);
    },
    getRandomValues(typedArray) {
        return getCrypto().getRandomValues(typedArray);
    },
    randomUUID() {
        return getCrypto().randomUUID();
    },
    digestAsync(algorithm, data) {
        return getCrypto().subtle.digest(algorithm, data);
    },
};
function hexString(buffer) {
    const byteArray = new Uint8Array(buffer);
    const hexCodes = [...byteArray].map((value) => {
        const hexCode = value.toString(16);
        const paddedHexCode = hexCode.padStart(2, '0');
        return paddedHexCode;
    });
    return hexCodes.join('');
}
//# sourceMappingURL=ExpoCrypto.web.js.map