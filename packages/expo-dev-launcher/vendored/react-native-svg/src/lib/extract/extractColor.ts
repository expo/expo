import { Platform } from 'react-native';
import { Color } from './types';

export const colors: { [colorname: string]: number[] } = {
  aliceblue: [240, 248, 255],
  antiquewhite: [250, 235, 215],
  aqua: [0, 255, 255],
  aquamarine: [127, 255, 212],
  azure: [240, 255, 255],
  beige: [245, 245, 220],
  bisque: [255, 228, 196],
  black: [0, 0, 0],
  blanchedalmond: [255, 235, 205],
  blue: [0, 0, 255],
  blueviolet: [138, 43, 226],
  brown: [165, 42, 42],
  burlywood: [222, 184, 135],
  cadetblue: [95, 158, 160],
  chartreuse: [127, 255, 0],
  chocolate: [210, 105, 30],
  coral: [255, 127, 80],
  cornflowerblue: [100, 149, 237],
  cornsilk: [255, 248, 220],
  crimson: [220, 20, 60],
  cyan: [0, 255, 255],
  darkblue: [0, 0, 139],
  darkcyan: [0, 139, 139],
  darkgoldenrod: [184, 134, 11],
  darkgray: [169, 169, 169],
  darkgreen: [0, 100, 0],
  darkgrey: [169, 169, 169],
  darkkhaki: [189, 183, 107],
  darkmagenta: [139, 0, 139],
  darkolivegreen: [85, 107, 47],
  darkorange: [255, 140, 0],
  darkorchid: [153, 50, 204],
  darkred: [139, 0, 0],
  darksalmon: [233, 150, 122],
  darkseagreen: [143, 188, 143],
  darkslateblue: [72, 61, 139],
  darkslategray: [47, 79, 79],
  darkslategrey: [47, 79, 79],
  darkturquoise: [0, 206, 209],
  darkviolet: [148, 0, 211],
  deeppink: [255, 20, 147],
  deepskyblue: [0, 191, 255],
  dimgray: [105, 105, 105],
  dimgrey: [105, 105, 105],
  dodgerblue: [30, 144, 255],
  firebrick: [178, 34, 34],
  floralwhite: [255, 250, 240],
  forestgreen: [34, 139, 34],
  fuchsia: [255, 0, 255],
  gainsboro: [220, 220, 220],
  ghostwhite: [248, 248, 255],
  gold: [255, 215, 0],
  goldenrod: [218, 165, 32],
  gray: [128, 128, 128],
  green: [0, 128, 0],
  greenyellow: [173, 255, 47],
  grey: [128, 128, 128],
  honeydew: [240, 255, 240],
  hotpink: [255, 105, 180],
  indianred: [205, 92, 92],
  indigo: [75, 0, 130],
  ivory: [255, 255, 240],
  khaki: [240, 230, 140],
  lavender: [230, 230, 250],
  lavenderblush: [255, 240, 245],
  lawngreen: [124, 252, 0],
  lemonchiffon: [255, 250, 205],
  lightblue: [173, 216, 230],
  lightcoral: [240, 128, 128],
  lightcyan: [224, 255, 255],
  lightgoldenrodyellow: [250, 250, 210],
  lightgray: [211, 211, 211],
  lightgreen: [144, 238, 144],
  lightgrey: [211, 211, 211],
  lightpink: [255, 182, 193],
  lightsalmon: [255, 160, 122],
  lightseagreen: [32, 178, 170],
  lightskyblue: [135, 206, 250],
  lightslategray: [119, 136, 153],
  lightslategrey: [119, 136, 153],
  lightsteelblue: [176, 196, 222],
  lightyellow: [255, 255, 224],
  lime: [0, 255, 0],
  limegreen: [50, 205, 50],
  linen: [250, 240, 230],
  magenta: [255, 0, 255],
  maroon: [128, 0, 0],
  mediumaquamarine: [102, 205, 170],
  mediumblue: [0, 0, 205],
  mediumorchid: [186, 85, 211],
  mediumpurple: [147, 112, 219],
  mediumseagreen: [60, 179, 113],
  mediumslateblue: [123, 104, 238],
  mediumspringgreen: [0, 250, 154],
  mediumturquoise: [72, 209, 204],
  mediumvioletred: [199, 21, 133],
  midnightblue: [25, 25, 112],
  mintcream: [245, 255, 250],
  mistyrose: [255, 228, 225],
  moccasin: [255, 228, 181],
  navajowhite: [255, 222, 173],
  navy: [0, 0, 128],
  oldlace: [253, 245, 230],
  olive: [128, 128, 0],
  olivedrab: [107, 142, 35],
  orange: [255, 165, 0],
  orangered: [255, 69, 0],
  orchid: [218, 112, 214],
  palegoldenrod: [238, 232, 170],
  palegreen: [152, 251, 152],
  paleturquoise: [175, 238, 238],
  palevioletred: [219, 112, 147],
  papayawhip: [255, 239, 213],
  peachpuff: [255, 218, 185],
  peru: [205, 133, 63],
  pink: [255, 192, 203],
  plum: [221, 160, 221],
  powderblue: [176, 224, 230],
  purple: [128, 0, 128],
  rebeccapurple: [102, 51, 153],
  red: [255, 0, 0],
  rosybrown: [188, 143, 143],
  royalblue: [65, 105, 225],
  saddlebrown: [139, 69, 19],
  salmon: [250, 128, 114],
  sandybrown: [244, 164, 96],
  seagreen: [46, 139, 87],
  seashell: [255, 245, 238],
  sienna: [160, 82, 45],
  silver: [192, 192, 192],
  skyblue: [135, 206, 235],
  slateblue: [106, 90, 205],
  slategray: [112, 128, 144],
  slategrey: [112, 128, 144],
  snow: [255, 250, 250],
  springgreen: [0, 255, 127],
  steelblue: [70, 130, 180],
  tan: [210, 180, 140],
  teal: [0, 128, 128],
  thistle: [216, 191, 216],
  tomato: [255, 99, 71],
  turquoise: [64, 224, 208],
  violet: [238, 130, 238],
  wheat: [245, 222, 179],
  white: [255, 255, 255],
  whitesmoke: [245, 245, 245],
  yellow: [255, 255, 0],
  yellowgreen: [154, 205, 50],
};
export const colorNames: { [colorname: string]: number | void } = {};
for (const name in colors) {
  if (colors.hasOwnProperty(name)) {
    const color: number[] = colors[name];
    const r = color[0];
    const g = color[1];
    const b = color[2];
    colorNames[name] = (0xff000000 | (r << 16) | (g << 8) | b) >>> 0;
  }
}
Object.freeze(colorNames);

function hslToRgb(_h: number, _s: number, _l: number, a: number) {
  const h = _h / 360;
  const s = _s / 100;
  const l = _l / 100;
  let t1;
  let t2;
  let t3;
  let rgb;
  let val;

  if (s === 0) {
    val = l;
    return [val, val, val, a];
  }

  if (l < 0.5) {
    t2 = l * (1 + s);
  } else {
    t2 = l + s - l * s;
  }

  t1 = 2 * l - t2;

  rgb = [0, 0, 0, a];
  for (let i = 0; i < 3; i++) {
    t3 = h + (1 / 3) * -(i - 1);
    if (t3 < 0) {
      t3++;
    }
    if (t3 > 1) {
      t3--;
    }

    if (6 * t3 < 1) {
      val = t1 + (t2 - t1) * 6 * t3;
    } else if (2 * t3 < 1) {
      val = t2;
    } else if (3 * t3 < 2) {
      val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
    } else {
      val = t1;
    }

    rgb[i] = val;
  }

  return rgb;
}

function hwbToRgb(_h: number, _w: number, _b: number, a: number) {
  const h = _h / 360;
  let wh = _w / 100;
  let bl = _b / 100;
  const ratio = wh + bl;
  let i;
  let v;
  let f;
  let n;

  // wh + bl cant be > 1
  if (ratio > 1) {
    wh /= ratio;
    bl /= ratio;
  }

  i = Math.floor(6 * h);
  v = 1 - bl;
  f = 6 * h - i;

  if ((i & 0x01) !== 0) {
    f = 1 - f;
  }

  n = wh + f * (v - wh); // linear interpolation

  let r;
  let g;
  let b;
  switch (i) {
    default:
    case 6:
    case 0:
      r = v;
      g = n;
      b = wh;
      break;
    case 1:
      r = n;
      g = v;
      b = wh;
      break;
    case 2:
      r = wh;
      g = v;
      b = n;
      break;
    case 3:
      r = wh;
      g = n;
      b = v;
      break;
    case 4:
      r = n;
      g = wh;
      b = v;
      break;
    case 5:
      r = v;
      g = wh;
      b = n;
      break;
  }

  return [r, g, b, a];
}

function clamp(num: number, min: number, max: number) {
  return Math.min(Math.max(min, num), max);
}

const abbr = /^#([a-f0-9]{3,4})$/i;
const hex = /^#([a-f0-9]{6})([a-f0-9]{2})?$/i;
const rgba = /^rgba?\(\s*([+-]?\d+)\s*,\s*([+-]?\d+)\s*,\s*([+-]?\d+)\s*(?:,\s*([+-]?[\d.]+)\s*)?\)$/;
const per = /^rgba?\(\s*([+-]?[\d.]+)%\s*,\s*([+-]?[\d.]+)%\s*,\s*([+-]?[\d.]+)%\s*(?:,\s*([+-]?[\d.]+)\s*)?\)$/;
const keyword = /(\D+)/;

function rgbFromString(string: string) {
  let rgb = [0, 0, 0, 1];
  let match;
  let i;
  let hexAlpha;

  if ((match = string.match(hex))) {
    hexAlpha = match[2];
    match = match[1];

    for (i = 0; i < 3; i++) {
      // https://jsperf.com/slice-vs-substr-vs-substring-methods-long-string/19
      const i2 = i * 2;
      rgb[i] = parseInt(match.slice(i2, i2 + 2), 16) / 255;
    }

    if (hexAlpha) {
      rgb[3] = Math.round((parseInt(hexAlpha, 16) / 255) * 100) / 100;
    }
  } else if ((match = string.match(abbr))) {
    match = match[1];
    hexAlpha = match[3];

    for (i = 0; i < 3; i++) {
      rgb[i] = parseInt(match[i] + match[i], 16) / 255;
    }

    if (hexAlpha) {
      rgb[3] =
        Math.round((parseInt(hexAlpha + hexAlpha, 16) / 255) * 100) / 100;
    }
  } else if ((match = string.match(rgba))) {
    for (i = 0; i < 3; i++) {
      rgb[i] = parseInt(match[i + 1], 0) / 255;
    }

    if (match[4]) {
      rgb[3] = parseFloat(match[4]);
    }
  } else if ((match = string.match(per))) {
    for (i = 0; i < 3; i++) {
      rgb[i] = parseFloat(match[i + 1]) / 100;
    }

    if (match[4]) {
      rgb[3] = parseFloat(match[4]);
    }
  } else if ((match = string.match(keyword))) {
    if (match[1] === 'transparent') {
      return [0, 0, 0, 0];
    }

    let color = colorNames[match[1]];

    if (!(typeof color === 'number')) {
      return null;
    }

    return integerColor(color);
  } else {
    return null;
  }

  for (i = 0; i < 4; i++) {
    rgb[i] = clamp(rgb[i], 0, 1);
  }

  return rgb;
}

const hslRegEx = /^hsla?\(\s*([+-]?(?:\d*\.)?\d+)(?:deg)?\s*,\s*([+-]?[\d.]+)%\s*,\s*([+-]?[\d.]+)%\s*(?:,\s*([+-]?[\d.]+)\s*)?\)$/;

function rgbFromHslString(string: string) {
  const match = string.match(hslRegEx);
  if (!match) {
    return null;
  }

  const alpha = parseFloat(match[4]);
  const h = (parseFloat(match[1]) + 360) % 360;
  const s = clamp(parseFloat(match[2]), 0, 100);
  const l = clamp(parseFloat(match[3]), 0, 100);
  const a = isNaN(alpha) ? 1 : clamp(alpha, 0, 1);
  return hslToRgb(h, s, l, a);
}

const hwbRegEx = /^hwb\(\s*([+-]?\d*[.]?\d+)(?:deg)?\s*,\s*([+-]?[\d.]+)%\s*,\s*([+-]?[\d.]+)%\s*(?:,\s*([+-]?[\d.]+)\s*)?\)$/;

function rgbFromHwbString(string: string) {
  const match = string.match(hwbRegEx);
  if (!match) {
    return null;
  }

  const alpha = parseFloat(match[4]);
  const h = ((parseFloat(match[1]) % 360) + 360) % 360;
  const w = clamp(parseFloat(match[2]), 0, 100);
  const b = clamp(parseFloat(match[3]), 0, 100);
  const a = isNaN(alpha) ? 1 : clamp(alpha, 0, 1);
  return hwbToRgb(h, w, b, a);
}

function colorFromString(string: string) {
  const prefix = string.substring(0, 3).toLowerCase();

  switch (prefix) {
    case 'hsl':
      return rgbFromHslString(string);
    case 'hwb':
      return rgbFromHwbString(string);
    default:
      return rgbFromString(string);
  }
}

const identity = (x: number) => x;

const toSignedInt32 = (x: number) => x | 0x0;

// Android use 32 bit *signed* integer to represent the color
// We utilize the fact that bitwise operations in JS also operates on
// signed 32 bit integers, so that we can use those to convert from
// *unsigned* to *signed* 32bit in that way.
export const integerColor =
  Platform.OS === 'android' ? toSignedInt32 : identity;

// Returns 0xaarrggbb or null
export default function extractColor(color: Color | void) {
  if (typeof color === 'number') {
    if (color >>> 0 === color && color >= 0 && color <= 0xffffffff) {
      return integerColor(color);
    }
    return null;
  }

  const parsedColor =
    typeof color === 'string' ? colorFromString(color) : color;
  if (!Array.isArray(parsedColor)) {
    return parsedColor;
  }

  const r = parsedColor[0];
  const g = parsedColor[1];
  const b = parsedColor[2];
  const a = parsedColor[3];

  const int32Color =
    ((a === undefined ? 0xff000000 : Math.round(a * 255) << 24) |
      (Math.round(r * 255) << 16) |
      (Math.round(g * 255) << 8) |
      Math.round(b * 255)) >>>
    0;

  return integerColor(int32Color);
}
