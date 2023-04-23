import NativeException from '../errors/NativeException';

if (globalThis.expo) {
  globalThis.expo.core = {
    NativeException,
  };
}
