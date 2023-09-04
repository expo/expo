import sha1 from './lib/sha1';
import v35 from './lib/v35';
import { Uuidv5Namespace } from './uuid.types';
export const uuid = {
    /**
     * DO NOT USE this function in security-sensitive contexts.
     */
    v5: v35('v5', 0x50, sha1),
    namespace: Uuidv5Namespace,
};
//# sourceMappingURL=uuid.web.js.map