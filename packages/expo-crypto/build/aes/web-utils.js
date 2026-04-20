export function hexToUintArray(hexString) {
    const byteLength = hexString.length / 2;
    const bytes = new Uint8Array(byteLength);
    for (let i = 0; i < hexString.length; i += 2) {
        bytes[i >>> 1] = parseInt(hexString.substring(i, i + 2), 16);
    }
    return bytes;
}
export function bytesToHex(bytes) {
    const hex = [];
    for (const byte of bytes) {
        const current = byte < 0 ? byte + 256 : byte;
        hex.push((current >>> 4).toString(16));
        hex.push((current & 0xf).toString(16));
    }
    return hex.join('');
}
export function base64ToUintArray(base64String) {
    const binaryString = atob(base64String);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}
export function uint8ArrayToBase64(uint8Array) {
    let binaryString = '';
    for (const byte of uint8Array) {
        binaryString += String.fromCharCode(byte);
    }
    return btoa(binaryString);
}
export function binaryInputBytes(input) {
    if (input instanceof Uint8Array) {
        return input;
    }
    if (input instanceof ArrayBuffer) {
        return new Uint8Array(input);
    }
    if (ArrayBuffer.isView(input)) {
        return new Uint8Array(input.buffer);
    }
    if (typeof input === 'string') {
        return base64ToUintArray(input);
    }
    throw new Error('Cannot parse serializable input as ArrayBuffer');
}
//# sourceMappingURL=web-utils.js.map