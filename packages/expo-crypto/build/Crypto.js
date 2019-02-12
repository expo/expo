import { UnavailabilityError } from 'expo-errors';
import ExpoCrypto from './ExpoCrypto';
import { Algorithm, Encoding } from './Crypto.types';
export * from './Crypto.types';
function assertAlgorithm(algorithm) {
    if (!Object.values(Algorithm).includes(algorithm)) {
        throw new TypeError(`expo-crypto: Invalid algorithm provided. Expected one of: Algorithm.${Object.keys(Algorithm).join(', Algorithm.')}`);
    }
}
function assertData(data) {
    if (data == null || typeof data !== 'string' || !data.length) {
        throw new TypeError(`expo-crypto: Invalid data provided. Expected a valid string.`);
    }
}
function assertEncoding(encoding) {
    if (!Object.values(Encoding).includes(encoding)) {
        throw new TypeError(`expo-crypto: Invalid encoding provided. Expected one of: Encoding.${Object.keys(Encoding).join(', Encoding.')}`);
    }
}
export async function digestStringAsync(algorithm, data, options = { encoding: Encoding.hex }) {
    if (!ExpoCrypto.digestStringAsync) {
        throw new UnavailabilityError('expo-crypto', 'digestStringAsync');
    }
    assertAlgorithm(algorithm);
    assertData(data);
    assertEncoding(options.encoding);
    return await ExpoCrypto.digestStringAsync(algorithm, data, options);
}
//# sourceMappingURL=Crypto.js.map