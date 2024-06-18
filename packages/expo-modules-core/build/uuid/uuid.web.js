import sha1 from './lib/sha1';
import v35 from './lib/v35';
import { Uuidv5Namespace } from './uuid.types';
function uuidv4() {
    if (
    // Node.js has supported global crypto since v15.
    typeof crypto === 'undefined' &&
        // Only use abstract imports in server environments.
        typeof window === 'undefined') {
        // eslint-disable-next-line no-eval
        return eval('require')('node:crypto').randomUUID();
    }
    return crypto.randomUUID();
}
const uuid = {
    v4: uuidv4,
    v5: v35('v5', 0x50, sha1),
    namespace: Uuidv5Namespace,
};
export default uuid;
//# sourceMappingURL=uuid.web.js.map