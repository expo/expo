import { deserialize, serialize } from '@ungap/structured-clone';

// Round-trip via `serialize`/`deserialize` instead of the default export, which delegates to
// the global `structuredClone` we install here and would otherwise recurse.
const structuredClonePolyfill = <T>(value: T, options?: { json?: boolean; lossy?: boolean }): T =>
  deserialize(serialize(value, options)) as T;

export default structuredClonePolyfill;
