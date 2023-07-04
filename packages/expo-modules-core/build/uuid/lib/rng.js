// @ts-ignore
let msCrypto;
if (typeof window != 'undefined') {
    msCrypto = window.crypto;
}
const getRandomValues = (typeof crypto != 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto)) ||
    (typeof msCrypto != 'undefined' &&
        typeof window.crypto.getRandomValues == 'function' &&
        msCrypto.getRandomValues.bind(msCrypto));
let exportedFunction;
if (getRandomValues) {
    // WHATWG crypto RNG - http://wiki.whatwg.org/wiki/Crypto
    const rnds8 = new Uint8Array(16); // eslint-disable-line no-undef
    exportedFunction = function whatwgRNG() {
        getRandomValues(rnds8);
        return rnds8;
    };
}
else {
    // Math.random()-based (RNG)
    //
    // If all else fails, use Math.random().  It's fast, but is of unspecified
    // quality.
    const rnds = new Array(16);
    exportedFunction = function mathRNG() {
        for (let i = 0, r; i < 16; i++) {
            if ((i & 0x03) === 0)
                r = Math.random() * 0x100000000;
            rnds[i] = (r >>> ((i & 0x03) << 3)) & 0xff;
        }
        return rnds;
    };
}
export default exportedFunction;
//# sourceMappingURL=rng.js.map