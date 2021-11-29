import { append, appendTransform, identity, reset, toArray } from '../Matrix2D';
import { parse } from './transform';
import { NumberProp, TransformedProps, TransformProps } from './types';

function appendTransformProps(props: TransformedProps) {
  const {
    x,
    y,
    originX,
    originY,
    scaleX,
    scaleY,
    rotation,
    skewX,
    skewY,
  } = props;
  appendTransform(
    x + originX,
    y + originY,
    scaleX,
    scaleY,
    rotation,
    skewX,
    skewY,
    originX,
    originY,
  );
}

function universal2axis(
  universal: NumberProp | NumberProp[] | undefined,
  axisX: NumberProp | void,
  axisY: NumberProp | void,
  defaultValue?: number,
): [number, number] {
  let x;
  let y;
  if (typeof universal === 'number') {
    x = y = universal;
  } else if (typeof universal === 'string') {
    const coords = universal.split(/\s*,\s*/);
    if (coords.length === 2) {
      x = +coords[0];
      y = +coords[1];
    } else if (coords.length === 1) {
      x = y = +coords[0];
    }
  } else if (Array.isArray(universal)) {
    if (universal.length === 2) {
      x = +universal[0];
      y = +universal[1];
    } else if (universal.length === 1) {
      x = y = +universal[0];
    }
  }

  axisX = +axisX;
  if (!isNaN(axisX)) {
    x = axisX;
  }

  axisY = +axisY;
  if (!isNaN(axisY)) {
    y = axisY;
  }

  return [x || defaultValue || 0, y || defaultValue || 0];
}

export function props2transform(
  props: TransformProps,
): TransformedProps | null {
  const {
    rotation,
    translate,
    translateX,
    translateY,
    origin,
    originX,
    originY,
    scale,
    scaleX,
    scaleY,
    skew,
    skewX,
    skewY,
    x,
    y,
  } = props;
  if (
    rotation == null &&
    translate == null &&
    translateX == null &&
    translateY == null &&
    origin == null &&
    originX == null &&
    originY == null &&
    scale == null &&
    scaleX == null &&
    scaleY == null &&
    skew == null &&
    skewX == null &&
    skewY == null &&
    x == null &&
    y == null
  ) {
    return null;
  }

  if (Array.isArray(x) || Array.isArray(y)) {
    console.warn(
      'Passing SvgLengthList to x or y attribute where SvgLength expected',
    );
  }
  const tr = universal2axis(
    translate,
    translateX || (Array.isArray(x) ? x[0] : x),
    translateY || (Array.isArray(y) ? y[0] : y),
  );
  const or = universal2axis(origin, originX, originY);
  const sc = universal2axis(scale, scaleX, scaleY, 1);
  const sk = universal2axis(skew, skewX, skewY);

  return {
    rotation: rotation == null ? 0 : +rotation || 0,
    originX: or[0],
    originY: or[1],
    scaleX: sc[0],
    scaleY: sc[1],
    skewX: sk[0],
    skewY: sk[1],
    x: tr[0],
    y: tr[1],
  };
}

export function transformToMatrix(
  props: TransformedProps | null,
  transform: number[] | string | TransformProps | void | null | undefined,
): [number, number, number, number, number, number] | null {
  if (!props && !transform) {
    return null;
  }
  reset();
  props && appendTransformProps(props);

  if (transform) {
    if (Array.isArray(transform)) {
      if (typeof transform[0] === 'number') {
        append(
          transform[0],
          transform[1],
          transform[2],
          transform[3],
          transform[4],
          transform[5],
        );
      }
      // noop for react-native transform arrays, let animated handle them
    } else if (typeof transform === 'string') {
      try {
        const t = parse(transform);
        append(t[0], t[3], t[1], t[4], t[2], t[5]);
      } catch (e) {
        console.error(e);
      }
    } else {
      const transformProps = props2transform(transform);
      transformProps && appendTransformProps(transformProps);
    }
  }

  return toArray();
}

export default function extractTransform(
  props: number[] | string | TransformProps,
) {
  if (Array.isArray(props)) {
    return props;
  }
  if (typeof props === 'string') {
    try {
      const t = parse(props);
      return [t[0], t[3], t[1], t[4], t[2], t[5]];
    } catch (e) {
      console.error(e);
      return identity;
    }
  }
  return transformToMatrix(props2transform(props), props.transform);
}
