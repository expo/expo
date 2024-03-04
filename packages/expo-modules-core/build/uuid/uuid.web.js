import sha1 from './lib/sha1';
import v35 from './lib/v35';
import { Uuidv5Namespace } from './uuid.types';
// A hack to prevent metro web from attempting to bundle `crypto` module.
const requireDynamic = require;
function uuidv4() {
    // Crypto needs to be required when run in Node.js environment.
    const cryptoObject = typeof crypto === 'undefined' || typeof crypto.randomUUID === 'undefined'
        ? requireDynamic('crypto')
        : crypto;
    if (!cryptoObject?.randomUUID) {
        throw Error("The browser doesn't support `crypto.randomUUID` function");
    }
    return cryptoObject.randomUUID();
}
const uuid = {
    v4: uuidv4,
    v5: v35('v5', 0x50, sha1),
    namespace: Uuidv5Namespace,
};
export default uuid;
//# sourceMappingURL=uuid.web.js.map