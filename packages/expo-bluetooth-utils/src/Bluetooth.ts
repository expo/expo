import { Base64 } from 'js-base64';

export { default as Characteristics } from './Characteristics';
export { default as Descriptors } from './Descriptors';
export { default as Services } from './Services';

/*
 * Convert a JS value before sending it to native.
 * 1. Use encodeURIComponent to get percent-encoded UTF-8 string value.
 * 2. Convert the percent-encodings to raw bytes.
 * 3. Pass value to Base64.btoa (Binary to ASCII)
 */
export function JSONToNative(str: string): string {
  // first we use encodeURIComponent to get percent-encoded UTF-8,
  // then we convert the percent encodings into raw bytes which
  // can be fed into btoa.
  const input = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (m, p) => `0x${p}`);
  return Base64.btoa(input);
}

/*
 * Take a native value and convert it to a JS value.
 * 1. Create binary value from input string
 * 2. Convert the raw bytes to percent-encodings.
 * 3. Decode the raw bytes
 */
export function nativeToJSON(str: string): string {
  const binary = Base64.atob(str);
  const modifiedBinaryString = binary
    .split('')
    .map(c => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
    .join('');
  return decodeURIComponent(modifiedBinaryString);
}
