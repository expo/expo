import sha1 from './lib/sha1';
import v35 from './lib/v35';
// In some cases it is necessary to explicitly import the crypto module
const crypto = require('crypto');
const randomUuid = crypto && crypto.randomUUID && crypto.randomUUID.bind(crypto);
function uuidv4() {
    if (!randomUuid) {
        throw Error("The browser doesn't support `crypto.randomUUID` function");
    }
    return randomUuid();
}
export const uuid = {
    v4: uuidv4,
    v5: v35('v5', 0x50, sha1),
};
//# sourceMappingURL=uuid.web.js.map