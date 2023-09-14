import sha1 from './lib/sha1';
import v35 from './lib/v35';
const nativeUuidv4 = globalThis?.expo?.uuidv4;
function uuidv4() {
    if (!nativeUuidv4) {
        throw Error("Native UUID version 4 generator implementation wasn't found in `expo-modules-core`");
    }
    return nativeUuidv4();
}
const uuid = {
    v4: uuidv4,
    v5: v35('v5', 0x50, sha1),
};
export default uuid;
//# sourceMappingURL=uuid.js.map