/**
 * based on
 * https://github.com/CreateJS/EaselJS/blob/631cdffb85eff9413dab43b4676f059b4232d291/src/easeljs/geom/Matrix2D.js
 */
const DEG_TO_RAD = Math.PI / 180;

export const identity: [number, number, number, number, number, number] = [
  1,
  0,
  0,
  1,
  0,
  0,
];

let a = 1;
let b = 0;
let c = 0;
let d = 1;
let tx = 0;
let ty = 0;
let hasInitialState = true;

/**
 * Represents an affine transformation matrix, and provides tools for concatenating transforms.
 *
 * This matrix can be visualized as:
 *
 * 	[ a  c  tx
 * 	  b  d  ty
 * 	  0  0  1  ]
 *
 * Note the locations of b and c.
 **/

/**
 * Reset current matrix to an identity matrix.
 * @method reset
 **/
export function reset() {
  if (hasInitialState) {
    return;
  }
  a = d = 1;
  b = c = tx = ty = 0;
  hasInitialState = true;
}

/**
 * Returns an array with current matrix values.
 * @method toArray
 * @return {Array} an array with current matrix values.
 **/
export function toArray(): [number, number, number, number, number, number] {
  if (hasInitialState) {
    return identity;
  }
  return [a, b, c, d, tx, ty];
}

/**
 * Appends the specified matrix properties to this matrix. All parameters are required.
 * This is the equivalent of multiplying `(this matrix) * (specified matrix)`.
 * @method append
 * @param {Number} a2
 * @param {Number} b2
 * @param {Number} c2
 * @param {Number} d2
 * @param {Number} tx2
 * @param {Number} ty2
 **/
export function append(
  a2: number,
  b2: number,
  c2: number,
  d2: number,
  tx2: number,
  ty2: number,
) {
  const change = a2 !== 1 || b2 !== 0 || c2 !== 0 || d2 !== 1;
  const translate = tx2 !== 0 || ty2 !== 0;
  if (!change && !translate) {
    return;
  }
  if (hasInitialState) {
    hasInitialState = false;
    a = a2;
    b = b2;
    c = c2;
    d = d2;
    tx = tx2;
    ty = ty2;
    return;
  }
  const a1 = a;
  const b1 = b;
  const c1 = c;
  const d1 = d;
  if (change) {
    a = a1 * a2 + c1 * b2;
    b = b1 * a2 + d1 * b2;
    c = a1 * c2 + c1 * d2;
    d = b1 * c2 + d1 * d2;
  }
  if (translate) {
    tx = a1 * tx2 + c1 * ty2 + tx;
    ty = b1 * tx2 + d1 * ty2 + ty;
  }
}

/**
 * Generates matrix properties from the specified display object transform properties, and appends them to this matrix.
 * For example, you can use this to generate a matrix representing the transformations of a display object:
 *
 * 	reset();
 * 	appendTransform(o.x, o.y, o.scaleX, o.scaleY, o.rotation);
 * 	var matrix = toArray()
 *
 * @method appendTransform
 * @param {Number} x
 * @param {Number} y
 * @param {Number} scaleX
 * @param {Number} scaleY
 * @param {Number} rotation
 * @param {Number} skewX
 * @param {Number} skewY
 * @param {Number} regX Optional.
 * @param {Number} regY Optional.
 **/
export function appendTransform(
  x: number,
  y: number,
  scaleX: number,
  scaleY: number,
  rotation: number,
  skewX: number,
  skewY: number,
  regX: number,
  regY: number,
) {
  if (
    x === 0 &&
    y === 0 &&
    scaleX === 1 &&
    scaleY === 1 &&
    rotation === 0 &&
    skewX === 0 &&
    skewY === 0 &&
    regX === 0 &&
    regY === 0
  ) {
    return;
  }
  let cos, sin;
  if (rotation % 360) {
    const r = rotation * DEG_TO_RAD;
    cos = Math.cos(r);
    sin = Math.sin(r);
  } else {
    cos = 1;
    sin = 0;
  }

  const a2 = cos * scaleX;
  const b2 = sin * scaleX;
  const c2 = -sin * scaleY;
  const d2 = cos * scaleY;

  if (skewX || skewY) {
    const b1 = Math.tan(skewY * DEG_TO_RAD);
    const c1 = Math.tan(skewX * DEG_TO_RAD);
    append(a2 + c1 * b2, b1 * a2 + b2, c2 + c1 * d2, b1 * c2 + d2, x, y);
  } else {
    append(a2, b2, c2, d2, x, y);
  }

  if (regX || regY) {
    // append the registration offset:
    tx -= regX * a + regY * c;
    ty -= regX * b + regY * d;
    hasInitialState = false;
  }
}
