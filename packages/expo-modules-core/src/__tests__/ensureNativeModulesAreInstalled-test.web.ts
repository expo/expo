import { ensureNativeModulesAreInstalled } from '../ensureNativeModulesAreInstalled';

describe('ensureNativeModulesAreInstalled', () => {
  it('installs the expo global when it is missing', () => {
    const expo = globalThis.expo;
    delete (globalThis as { expo?: unknown }).expo;
    try {
      ensureNativeModulesAreInstalled();

      expect(globalThis.expo?.EventEmitter).toBeDefined();
    } finally {
      globalThis.expo = expo;
    }
  });
});
