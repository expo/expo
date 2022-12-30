export const sRGBToLinear = (value) => {
    const v = value / 255;
    if (v <= 0.04045) {
        return v / 12.92;
    }
    else {
        return Math.pow((v + 0.055) / 1.055, 2.4);
    }
};
export const linearTosRGB = (value) => {
    const v = Math.max(0, Math.min(1, value));
    if (v <= 0.0031308) {
        return Math.trunc(v * 12.92 * 255 + 0.5);
    }
    else {
        return Math.trunc((1.055 * Math.pow(v, 1 / 2.4) - 0.055) * 255 + 0.5);
    }
};
export const sign = (n) => (n < 0 ? -1 : 1);
export const signPow = (val, exp) => sign(val) * Math.pow(Math.abs(val), exp);
//# sourceMappingURL=utils.js.map