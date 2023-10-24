// @ts-expect-error: If globalThis.expo is undefined then expo-modules-core is not installed or available in the native runtime.
const TextEncoder = globalThis.expo!.TextEncoder;

const originalEncode = TextEncoder.prototype.encode;

TextEncoder.prototype.encode = function () {
  return new Uint8Array(originalEncode.apply(this, arguments));
};

globalThis.TextEncoder = TextEncoder;

globalThis.TextDecoder = globalThis.expo!.TextDecoder;
