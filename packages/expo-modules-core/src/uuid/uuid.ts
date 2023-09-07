import sha1 from './lib/sha1';
import v35 from './lib/v35';
import { UUID } from './uuid.types';

const nativeUuidv4 = globalThis?.expo?.uuidv4;

function uuidv4(): string {
  if (!nativeUuidv4) {
    throw Error(
      "Native UUID version 4 generator implementation wasn't found in `expo-modules-core`"
    );
  }

  return nativeUuidv4();
}

const uuid: UUID = {
  v4: uuidv4,
  v5: v35('v5', 0x50, sha1),
};
export default uuid;
