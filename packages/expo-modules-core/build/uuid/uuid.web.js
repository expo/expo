import sha1 from './lib/sha1';
import v35 from './lib/v35';
function uuidv4() {
    // Crypto needs to be required when run in Node.js environment.
    const cryptoObject = typeof crypto === 'undefined' || typeof crypto.randomUUID === 'undefined'
        ? require('crypto')
        : crypto;
    const randomUuid = cryptoObject?.randomUUID && cryptoObject.randomUUID?.bind(cryptoObject);
    if (!randomUuid) {
        throw Error("The browser doesn't support `crypto.randomUUID` function");
    }
    return randomUuid();
}
const uuid = {
    v4: uuidv4,
    v5: v35('v5', 0x50, sha1),
};
export default uuid;
//# sourceMappingURL=uuid.web.js.map