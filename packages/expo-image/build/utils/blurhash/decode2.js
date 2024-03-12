const digit = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{|}~';
const decode83 = (str, start, end) => {
    let value = 0;
    while (start < end) {
        value *= 83;
        value += digit.indexOf(str[start++]);
    }
    return value;
};
const pow = Math.pow;
const PI = Math.PI;
const PI2 = PI * 2;
const d = 3294.6;
const e = 269.025;
const sRGBToLinear = (value) => (value > 10.31475 ? pow(value / e + 0.052132, 2.4) : value / d);
const linearTosRGB = (v) => ~~(v > 0.00001227 ? e * pow(v, 0.416666) - 13.025 : v * d + 1);
const signSqr = (x) => (x < 0 ? -1 : 1) * x * x;
/**
 * Fast approximate cosine implementation
 * Based on FTrig https://github.com/netcell/FTrig
 */
const fastCos = (x) => {
    x += PI / 2;
    while (x > PI) {
        x -= PI2;
    }
    const cos = 1.27323954 * x - 0.405284735 * signSqr(x);
    return 0.225 * (signSqr(cos) - cos) + cos;
};
/**
 * Extracts average color from BlurHash image
 * @param {string} blurHash BlurHash image string
 * @returns {[number, number, number]}
 */
export function getBlurHashAverageColor(blurHash) {
    const val = decode83(blurHash, 2, 6);
    return [val >> 16, (val >> 8) & 255, val & 255];
}
/**
 * Decodes BlurHash image
 * @param {string} blurHash BlurHash image string
 * @param {number} width Output image width
 * @param {number} height Output image height
 * @param {?number} punch
 * @returns {Uint8ClampedArray}
 */
export function decodeBlurHash(blurHash, width, height, punch) {
    const sizeFlag = decode83(blurHash, 0, 1);
    const numX = (sizeFlag % 9) + 1;
    const numY = ~~(sizeFlag / 9) + 1;
    const size = numX * numY;
    let i = 0, j = 0, x = 0, y = 0, r = 0, g = 0, b = 0, basis = 0, basisY = 0, colorIndex = 0, pixelIndex = 0, yh = 0, xw = 0, value = 0;
    const maximumValue = ((decode83(blurHash, 1, 2) + 1) / 13446) * (punch | 1);
    const colors = new Float64Array(size * 3);
    const averageColor = getBlurHashAverageColor(blurHash);
    for (i = 0; i < 3; i++) {
        colors[i] = sRGBToLinear(averageColor[i]);
    }
    for (i = 1; i < size; i++) {
        value = decode83(blurHash, 4 + i * 2, 6 + i * 2);
        colors[i * 3] = signSqr(~~(value / (19 * 19)) - 9) * maximumValue;
        colors[i * 3 + 1] = signSqr((~~(value / 19) % 19) - 9) * maximumValue;
        colors[i * 3 + 2] = signSqr((value % 19) - 9) * maximumValue;
    }
    const bytesPerRow = width * 4;
    const pixels = new Uint8ClampedArray(bytesPerRow * height);
    for (y = 0; y < height; y++) {
        yh = (PI * y) / height;
        for (x = 0; x < width; x++) {
            r = 0;
            g = 0;
            b = 0;
            xw = (PI * x) / width;
            for (j = 0; j < numY; j++) {
                basisY = fastCos(yh * j);
                for (i = 0; i < numX; i++) {
                    basis = fastCos(xw * i) * basisY;
                    colorIndex = (i + j * numX) * 3;
                    r += colors[colorIndex] * basis;
                    g += colors[colorIndex + 1] * basis;
                    b += colors[colorIndex + 2] * basis;
                }
            }
            pixelIndex = 4 * x + y * bytesPerRow;
            pixels[pixelIndex] = linearTosRGB(r);
            pixels[pixelIndex + 1] = linearTosRGB(g);
            pixels[pixelIndex + 2] = linearTosRGB(b);
            pixels[pixelIndex + 3] = 255; // alpha
        }
    }
    return pixels;
}
//# sourceMappingURL=decode2.js.map