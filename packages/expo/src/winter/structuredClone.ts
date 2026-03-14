import { serialize, deserialize } from '@ungap/structured-clone';

// if structuredClone is already declared if used directly it will run into an infinite loop
const clone = (any: any, options?: { json?: boolean; lossy?: boolean }) =>
  deserialize(serialize(any, options));

export default clone;
