import bytesToUuid from './lib/bytesToUuid';
import { Uuidv5Namespace } from './uuid.types';
const nativeUuidv4 = globalThis?.expo?.uuidv4;
const nativeUuidv5 = globalThis?.expo?.uuidv5;
function uuidv4() {
    if (!nativeUuidv4) {
        throw Error("Native UUID version 4 generator implementation wasn't found in `expo-modules-core`");
    }
    return nativeUuidv4();
}
function uuidv5(name, namespace) {
    const parsedNamespace = Array.isArray(namespace) && namespace.length === 16 ? bytesToUuid(namespace) : namespace;
    // If parsed namespace is still an array it means that it wasn't valid
    if (Array.isArray(parsedNamespace)) {
        throw new Error('`namespace` must be a valid UUID string or an Array of 16 byte values');
    }
    if (!nativeUuidv5) {
        throw Error("Native UUID type 5 generator implementation wasn't found in `expo-modules-core`");
    }
    return nativeUuidv5(name, parsedNamespace);
}
const uuid = {
    v4: uuidv4,
    v5: uuidv5,
    namespace: Uuidv5Namespace,
};
export default uuid;
//# sourceMappingURL=uuid.js.map