import sha1 from './lib/sha1';
import v35 from './lib/v35';
import { UUID, Uuidv5Namespace } from './uuid.types';

function uuidv4(): string {
  if (
    // We use this code path in jest-expo.
    process.env.NODE_ENV === 'test' ||
    // Node.js has supported global crypto since v15.
    (typeof crypto === 'undefined' &&
      // Only use abstract imports in server environments.
      typeof window === 'undefined')
  ) {
    // NOTE: Metro statically extracts all `require` statements to resolve them for environments
    // that don't support `require` natively. Here we check if we're running in a server environment
    // by using the standard `typeof window` check, then running `eval` to skip Metro's static
    // analysis and keep the `require` statement intact for runtime evaluation.
    // eslint-disable-next-line no-eval
    return eval('require')('node:crypto').randomUUID();
  }

  return crypto.randomUUID();
}

const uuid: UUID = {
  v4: uuidv4,
  v5: v35('v5', 0x50, sha1),
  namespace: Uuidv5Namespace,
};

export default uuid;
