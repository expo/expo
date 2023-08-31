import bytesToUuid from './lib/bytesToUuid';
import uuidToBytes from './lib/uuidToBytes';
const nativeUuidv4 = globalThis?.expo?.getUuidv4;
export function uuidv4(options, buf, offset) {
    if (!nativeUuidv4) {
        throw Error("Native UUID type 4 generator implementation wasn't found in `expo-modules-core`");
    }
    const i = buf && offset ? offset : 0;
    let buffer = null;
    if (typeof options == 'string') {
        buffer = options === 'binary' ? new Array(16) : null;
        options = undefined;
    }
    options = options || undefined;
    // @ts-expect-error
    let rnds = options?.random || options?.rng();
    if (!rnds && !buf) {
        return nativeUuidv4();
    }
    else if (!rnds && buf) {
        rnds = uuidToBytes(nativeUuidv4());
    }
    // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
    rnds[6] = (rnds[6] & 0x0f) | 0x40;
    rnds[8] = (rnds[8] & 0x3f) | 0x80;
    // Copy bytes to buffer, if provided
    if (buffer) {
        for (let ii = 0; ii < 16; ++ii) {
            buffer[i + ii] = rnds[ii];
        }
    }
    return buffer || bytesToUuid(rnds);
}
//# sourceMappingURL=v4.js.map