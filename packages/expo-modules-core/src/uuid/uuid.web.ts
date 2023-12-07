import sha1 from './lib/sha1';
import v35 from './lib/v35';
import { UUID, Uuidv5Namespace } from './uuid.types';

function uuidv4(): string {
  // Crypto needs to be required when run in Node.js environment.
  const cryptoObject =
    typeof crypto === 'undefined' || typeof crypto.randomUUID === 'undefined'
      ? require('crypto')
      : crypto;

  if (!cryptoObject?.randomUUID) {
    throw Error("The browser doesn't support `crypto.randomUUID` function");
  }
  return cryptoObject.randomUUID();
}

const uuid: UUID = {
  v4: uuidv4,
  v5: v35('v5', 0x50, sha1),
  namespace: Uuidv5Namespace,
};

export default uuid;
