import bytesToUuid from './lib/bytesToUuid';
import { Uuidv5Namespace } from './types/uuid.types';

const nativeUuidv5 = globalThis?.expo?.getUuidv5;
export default function uuidv5(name: string, namespace: Uuidv5Namespace | string | number[]) {
  const parsedNamespace =
    Array.isArray(namespace) && namespace.length === 16 ? bytesToUuid(namespace) : namespace;

  // If parsed namespace is still an array it means that it wasn't a valid
  if (Array.isArray(parsedNamespace)) {
    throw new Error('`namespace` must be uuid string or an Array of 16 byte values');
  }

  if (!nativeUuidv5) {
    throw Error("Native UUID type 5 generator implementation wasn't found in `expo-modules-core`");
  }

  return nativeUuidv5(name, parsedNamespace);
}
