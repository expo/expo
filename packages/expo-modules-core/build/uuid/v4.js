import bytesToUuid from './lib/bytesToUuid';
import rng from './lib/rng';
export function uuidv4(options, buf, offset) {
    const i = (buf && offset) || 0;
    let buffer = null;
    if (typeof options == 'string') {
        buffer = options === 'binary' ? new Array(16) : null;
        options = undefined;
    }
    options = options || undefined;
    // @ts-expect-error
    const rnds = options?.random || (options?.rng || rng)();
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