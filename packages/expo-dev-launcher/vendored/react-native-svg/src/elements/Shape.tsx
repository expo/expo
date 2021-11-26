import { Component } from 'react';
import SvgTouchableMixin from '../lib/SvgTouchableMixin';
import { NativeModules, findNodeHandle, NativeMethods } from 'react-native';
import { TransformProps } from '../lib/extract/types';
const { RNSVGRenderableManager } = NativeModules;

export interface SVGBoundingBoxOptions {
  fill?: boolean;
  stroke?: boolean;
  markers?: boolean;
  clipped?: boolean;
}

export interface DOMPointInit {
  x?: number;
  y?: number;
  z?: number;
  w?: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface SVGPoint extends Point {
  constructor(point?: Point): SVGPoint;
  matrixTransform(matrix: Matrix): SVGPoint;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface SVGRect extends Rect {}

export interface Matrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

export interface SVGMatrix extends Matrix {
  constructor(matrix?: Matrix): SVGMatrix;
  multiply(secondMatrix: Matrix): SVGMatrix;
  inverse(): SVGMatrix;
  translate(x: number, y: number): SVGMatrix;
  scale(scaleFactor: number): SVGMatrix;
  scaleNonUniform(scaleFactorX: number, scaleFactorY: number): SVGMatrix;
  rotate(angle: number): SVGMatrix;
  rotateFromVector(x: number, y: number): SVGMatrix;
  flipX(): SVGMatrix;
  flipY(): SVGMatrix;
  skewX(angle: number): SVGMatrix;
  skewY(angle: number): SVGMatrix;
}

export function multiply_matrices(l: Matrix, r: Matrix): Matrix {
  const { a: al, b: bl, c: cl, d: dl, e: el, f: fl } = l;
  const { a: ar, b: br, c: cr, d: dr, e: er, f: fr } = r;

  const a = al * ar + cl * br;
  const c = al * cr + cl * dr;
  const e = al * er + cl * fr + el;
  const b = bl * ar + dl * br;
  const d = bl * cr + dl * dr;
  const f = bl * er + dl * fr + fl;

  return { a, c, e, b, d, f };
}

export function invert({ a, b, c, d, e, f }: Matrix): Matrix {
  const n = a * d - b * c;
  return {
    a: d / n,
    b: -b / n,
    c: -c / n,
    d: a / n,
    e: (c * f - d * e) / n,
    f: -(a * f - b * e) / n,
  };
}

const deg2rad = Math.PI / 180;

export class SVGMatrix implements SVGMatrix {
  constructor(matrix?: Matrix) {
    if (matrix) {
      const { a, b, c, d, e, f } = matrix;
      this.a = a;
      this.b = b;
      this.c = c;
      this.d = d;
      this.e = e;
      this.f = f;
    } else {
      this.a = 1;
      this.b = 0;
      this.c = 0;
      this.d = 1;
      this.e = 0;
      this.f = 0;
    }
  }
  multiply(secondMatrix: Matrix): SVGMatrix {
    return new SVGMatrix(multiply_matrices(this, secondMatrix));
  }
  inverse(): SVGMatrix {
    return new SVGMatrix(invert(this));
  }
  translate(x: number, y: number): SVGMatrix {
    return new SVGMatrix(
      multiply_matrices(this, { a: 1, b: 0, c: 0, d: 1, e: x, f: y }),
    );
  }
  scale(scaleFactor: number): SVGMatrix {
    return new SVGMatrix(
      multiply_matrices(this, {
        a: scaleFactor,
        b: 0,
        c: 0,
        d: scaleFactor,
        e: 0,
        f: 0,
      }),
    );
  }
  scaleNonUniform(scaleFactorX: number, scaleFactorY: number): SVGMatrix {
    return new SVGMatrix(
      multiply_matrices(this, {
        a: scaleFactorX,
        b: 0,
        c: 0,
        d: scaleFactorY,
        e: 0,
        f: 0,
      }),
    );
  }
  rotate(angle: number): SVGMatrix {
    const cos = Math.cos(deg2rad * angle);
    const sin = Math.sin(deg2rad * angle);
    return new SVGMatrix(
      multiply_matrices(this, { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 }),
    );
  }
  rotateFromVector(x: number, y: number): SVGMatrix {
    const angle = Math.atan2(y, x);
    const cos = Math.cos(deg2rad * angle);
    const sin = Math.sin(deg2rad * angle);
    return new SVGMatrix(
      multiply_matrices(this, { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 }),
    );
  }
  flipX(): SVGMatrix {
    return new SVGMatrix(
      multiply_matrices(this, { a: -1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
    );
  }
  flipY(): SVGMatrix {
    return new SVGMatrix(
      multiply_matrices(this, { a: 1, b: 0, c: 0, d: -1, e: 0, f: 0 }),
    );
  }
  skewX(angle: number): SVGMatrix {
    return new SVGMatrix(
      multiply_matrices(this, {
        a: 1,
        b: 0,
        c: Math.tan(deg2rad * angle),
        d: 1,
        e: 0,
        f: 0,
      }),
    );
  }
  skewY(angle: number): SVGMatrix {
    return new SVGMatrix(
      multiply_matrices(this, {
        a: 1,
        b: Math.tan(deg2rad * angle),
        c: 0,
        d: 1,
        e: 0,
        f: 0,
      }),
    );
  }
}

export function matrixTransform(matrix: Matrix, point: Point): Point {
  const { a, b, c, d, e, f } = matrix;
  const { x, y } = point;
  return {
    x: a * x + c * y + e,
    y: b * x + d * y + f,
  };
}

export class SVGPoint implements SVGPoint {
  constructor(point?: Point) {
    if (point) {
      const { x, y } = point;
      this.x = x;
      this.y = y;
    } else {
      this.x = 0;
      this.y = 0;
    }
  }
  matrixTransform(matrix: Matrix): SVGPoint {
    return new SVGPoint(matrixTransform(matrix, this));
  }
}

export const ownerSVGElement = {
  createSVGPoint(): SVGPoint {
    return new SVGPoint();
  },
  createSVGMatrix(): SVGMatrix {
    return new SVGMatrix();
  },
};

export default class Shape<P> extends Component<P> {
  [x: string]: unknown;
  root: (Shape<P> & NativeMethods) | null = null;
  constructor(props: P, context: {}) {
    super(props, context);
    SvgTouchableMixin(this);
  }
  refMethod: (instance: (Shape<P> & NativeMethods) | null) => void = (
    instance: (Shape<P> & NativeMethods) | null,
  ) => {
    this.root = instance;
  };
  setNativeProps = (
    props: Object & {
      matrix?: [number, number, number, number, number, number];
    } & TransformProps,
  ) => {
    this.root && this.root.setNativeProps(props);
  };
  /*
   * The following native methods are experimental and likely broken in some
   * ways. If you have a use case for these, please open an issue with a
   * representative example / reproduction.
   * */
  getBBox = (options?: SVGBoundingBoxOptions): SVGRect => {
    const { fill = true, stroke = true, markers = true, clipped = true } =
      options || {};
    const handle = findNodeHandle(this.root as Component);
    return RNSVGRenderableManager.getBBox(handle, {
      fill,
      stroke,
      markers,
      clipped,
    });
  };
  getCTM = (): SVGMatrix => {
    const handle = findNodeHandle(this.root as Component);
    return new SVGMatrix(RNSVGRenderableManager.getCTM(handle));
  };
  getScreenCTM = (): SVGMatrix => {
    const handle = findNodeHandle(this.root as Component);
    return new SVGMatrix(RNSVGRenderableManager.getScreenCTM(handle));
  };
  isPointInFill = (options: DOMPointInit): boolean => {
    const handle = findNodeHandle(this.root as Component);
    return RNSVGRenderableManager.isPointInFill(handle, options);
  };
  isPointInStroke = (options: DOMPointInit): boolean => {
    const handle = findNodeHandle(this.root as Component);
    return RNSVGRenderableManager.isPointInStroke(handle, options);
  };
  getTotalLength = (): number => {
    const handle = findNodeHandle(this.root as Component);
    return RNSVGRenderableManager.getTotalLength(handle);
  };
  getPointAtLength = (length: number): SVGPoint => {
    const handle = findNodeHandle(this.root as Component);
    return new SVGPoint(
      RNSVGRenderableManager.getPointAtLength(handle, { length }),
    );
  };
}
Shape.prototype.ownerSVGElement = ownerSVGElement;
