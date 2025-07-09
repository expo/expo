export const VALUE_BYTES_LIMIT = 2048;
// note this probably could be JS-engine dependent
// inspired by https://stackoverflow.com/a/39488643
export function byteCountOverLimit(value, limit) {
    let bytes = 0;
    for (let i = 0; i < value.length; i++) {
        const codePoint = value.charCodeAt(i);
        // Lone surrogates cannot be passed to encodeURI
        if (codePoint >= 0xd800 && codePoint < 0xe000) {
            if (codePoint < 0xdc00 && i + 1 < value.length) {
                const next = value.charCodeAt(i + 1);
                if (next >= 0xdc00 && next < 0xe000) {
                    bytes += 4;
                    if (bytes > limit) {
                        return true;
                    }
                    i++;
                    continue;
                }
            }
        }
        bytes += codePoint < 0x80 ? 1 : codePoint < 0x800 ? 2 : 3;
        if (bytes > limit) {
            return true;
        }
    }
    return bytes > limit;
}
//# sourceMappingURL=byteCounter.js.map