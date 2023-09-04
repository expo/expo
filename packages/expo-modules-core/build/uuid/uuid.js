import bytesToUuid from './lib/bytesToUuid';
import { Uuidv5Namespace } from './uuid.types';
const nativeUuidv5 = globalThis?.expo?.uuidv5;
export default function uuidv5(name, namespace) {
    const parsedNamespace = Array.isArray(namespace) && namespace.length === 16 ? bytesToUuid(namespace) : namespace;
    // If parsed namespace is still an array it means that it wasn't valid
    if (Array.isArray(parsedNamespace)) {
        throw new Error('`namespace` must be uuid string or an Array of 16 byte values');
    }
    if (!nativeUuidv5) {
        throw Error("Native UUID type 5 generator implementation wasn't found in `expo-modules-core`");
    }
    return nativeUuidv5(name, parsedNamespace);
}
export const uuid = {
    v5: uuidv5,
    namespace: Uuidv5Namespace,
};
//# sourceMappingURL=uuid.js.map