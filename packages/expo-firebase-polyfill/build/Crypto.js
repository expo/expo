/**
 * A simple Crypto.getRandomValues implementation using Math.random().
 * https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
 * @param typedArray
 */
export function getRandomValues(typedArray) {
    if (!(typedArray instanceof Int8Array ||
        typedArray instanceof Uint8Array ||
        typedArray instanceof Int16Array ||
        typedArray instanceof Uint16Array ||
        typedArray instanceof Int32Array ||
        typedArray instanceof Uint32Array ||
        typedArray instanceof Uint8ClampedArray)) {
        throw new Error('Expected an integer typed-array');
    }
    const writeArray = new Uint8Array(typedArray.buffer);
    for (let i = 0; i < writeArray.length; i++) {
        writeArray[i] = Math.floor(Math.random() * 256) % 256;
    }
    return typedArray;
}
/*
// Polyfill `Crypto.getRandomValues`
// @ts-ignore
if (!global.crypto || !global.crypto.getRandomValues) {
  // @ts-ignore
  global.crypto = global.crypto || {};
  // @ts-ignore
  global.crypto.getRandomValues = getRandomValues;
}
*/
//# sourceMappingURL=Crypto.js.map