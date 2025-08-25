import bytesToUuid from './lib/bytesToUuid';
import { UUID, Uuidv5Namespace } from './uuid.types';

function uuidv4(): string {
  const nativeUuidv4 = globalThis?.expo?.uuidv4;

  if (!nativeUuidv4) {
    throw Error(
      "Native UUID version 4 generator implementation wasn't found in `expo-modules-core`"
    );
  }

  return nativeUuidv4();
}

function uuidv5(name: string, namespace: string | number[]) {
  const parsedNamespace =
    Array.isArray(namespace) && namespace.length === 16 ? bytesToUuid(namespace) : namespace;

  // If parsed namespace is still an array it means that it wasn't valid
  if (Array.isArray(parsedNamespace)) {
    throw new Error('`namespace` must be a valid UUID string or an Array of 16 byte values');
  }

  const nativeUuidv5 = globalThis?.expo?.uuidv5;

  if (!nativeUuidv5) {
    throw Error("Native UUID type 5 generator implementation wasn't found in `expo-modules-core`");
  }

  return nativeUuidv5(name, parsedNamespace);
}

const uuid: UUID = {
  v4: uuidv4,
  v5: uuidv5,
  namespace: Uuidv5Namespace,
};
export default uuid;
