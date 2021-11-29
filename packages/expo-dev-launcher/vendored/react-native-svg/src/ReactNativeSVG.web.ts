// @ts-ignore
import * as React from 'react';
import {
  GestureResponderEvent,
  // @ts-ignore
  unstable_createElement as ucE,
  // @ts-ignore
  createElement as cE,
} from 'react-native';
import { NumberArray, NumberProp } from './lib/extract/types';
import SvgTouchableMixin from './lib/SvgTouchableMixin';
import { resolve } from './lib/resolve';

const createElement = cE || ucE;

type BlurEvent = Object;
type FocusEvent = Object;
type PressEvent = Object;
type LayoutEvent = Object;
type EdgeInsetsProp = Object;

interface BaseProps {
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityIgnoresInvertColors?: boolean;
  accessibilityRole?: string;
  accessibilityState?: Object;
  delayLongPress?: number;
  delayPressIn?: number;
  delayPressOut?: number;
  disabled?: boolean;
  hitSlop?: EdgeInsetsProp;
  nativeID?: string;
  touchSoundDisabled?: boolean;
  onBlur?: (e: BlurEvent) => void;
  onFocus?: (e: FocusEvent) => void;
  onLayout?: (event: LayoutEvent) => object;
  onLongPress?: (event: PressEvent) => object;
  onClick?: (event: PressEvent) => object;
  onPress?: (event: PressEvent) => object;
  onPressIn?: (event: PressEvent) => object;
  onPressOut?: (event: PressEvent) => object;
  pressRetentionOffset?: EdgeInsetsProp;
  rejectResponderTermination?: boolean;

  translate: NumberArray;
  scale: NumberArray;
  rotation: NumberArray;
  skewX: NumberProp;
  skewY: NumberProp;
  originX: NumberProp;
  originY: NumberProp;

  fontStyle?: string;
  fontWeight?: NumberProp;
  fontSize?: NumberProp;
  fontFamily?: string;
  forwardedRef: {};
  style: Iterable<{}>;
}

/**
 * `react-native-svg` supports additional props that aren't defined in the spec.
 * This function replaces them in a spec conforming manner.
 *
 * @param {WebShape} self Instance given to us.
 * @param {Object?} props Optional overridden props given to us.
 * @returns {Object} Cleaned props object.
 * @private
 */
const prepare = <T extends BaseProps>(
  self: WebShape<T>,
  props = self.props,
) => {
  const {
    translate,
    scale,
    rotation,
    skewX,
    skewY,
    originX,
    originY,
    fontFamily,
    fontSize,
    fontWeight,
    fontStyle,
    style,
    forwardedRef,
    onPress,
    onPressIn,
    onPressOut,
    onLongPress,
    // @ts-ignore
    ...rest
  } = props;
  const hasTouchableProperty =
    onPress || onPressIn || onPressOut || onLongPress;
  const clean: {
    onStartShouldSetResponder?: (e: GestureResponderEvent) => boolean;
    onResponderMove?: (e: GestureResponderEvent) => void;
    onResponderGrant?: (e: GestureResponderEvent) => void;
    onResponderRelease?: (e: GestureResponderEvent) => void;
    onResponderTerminate?: (e: GestureResponderEvent) => void;
    onResponderTerminationRequest?: (e: GestureResponderEvent) => boolean;
    transform?: string;
    style?: {};
    ref?: {};
  } = {
    ...(hasTouchableProperty
      ? {
          onStartShouldSetResponder:
            self.touchableHandleStartShouldSetResponder,
          onResponderTerminationRequest:
            self.touchableHandleResponderTerminationRequest,
          onResponderGrant: self.touchableHandleResponderGrant,
          onResponderMove: self.touchableHandleResponderMove,
          onResponderRelease: self.touchableHandleResponderRelease,
          onResponderTerminate: self.touchableHandleResponderTerminate,
        }
      : null),
    ...rest,
  };

  const transform = [];

  if (originX != null || originY != null) {
    transform.push(`translate(${originX || 0}, ${originY || 0})`);
  }
  if (translate != null) {
    transform.push(`translate(${translate})`);
  }
  if (scale != null) {
    transform.push(`scale(${scale})`);
  }
  // rotation maps to rotate, not to collide with the text rotate attribute (which acts per glyph rather than block)
  if (rotation != null) {
    transform.push(`rotate(${rotation})`);
  }
  if (skewX != null) {
    transform.push(`skewX(${skewX})`);
  }
  if (skewY != null) {
    transform.push(`skewY(${skewY})`);
  }
  if (originX != null || originY != null) {
    transform.push(`translate(${-originX || 0}, ${-originY || 0})`);
  }

  if (transform.length) {
    clean.transform = transform.join(' ');
  }

  if (forwardedRef) {
    clean.ref = forwardedRef;
  }

  const styles: {
    fontStyle?: string;
    fontFamily?: string;
    fontSize?: NumberProp;
    fontWeight?: NumberProp;
  } = {};

  if (fontFamily != null) {
    styles.fontFamily = fontFamily;
  }
  if (fontSize != null) {
    styles.fontSize = fontSize;
  }
  if (fontWeight != null) {
    styles.fontWeight = fontWeight;
  }
  if (fontStyle != null) {
    styles.fontStyle = fontStyle;
  }

  clean.style = resolve(style, styles);

  return clean;
};

const getBoundingClientRect = (node: SVGElement) => {
  if (node) {
    // @ts-ignore
    const isElement = node.nodeType === 1; /* Node.ELEMENT_NODE */
    // @ts-ignore
    if (isElement && typeof node.getBoundingClientRect === 'function') {
      // @ts-ignore
      return node.getBoundingClientRect();
    }
  }
};

const measureLayout = (
  node: SVGElement,
  callback: (
    x: number,
    y: number,
    width: number,
    height: number,
    left: number,
    top: number,
  ) => void,
) => {
  // @ts-ignore
  const relativeNode = node && node.parentNode;
  if (relativeNode) {
    setTimeout(() => {
      // @ts-ignore
      const relativeRect = getBoundingClientRect(relativeNode);
      const { height, left, top, width } = getBoundingClientRect(node);
      const x = left - relativeRect.left;
      const y = top - relativeRect.top;
      callback(x, y, width, height, left, top);
    }, 0);
  }
};

function remeasure() {
  // @ts-ignore
  const tag = this.state.touchable.responderID;
  if (tag == null) {
    return;
  }
  // @ts-ignore
  measureLayout(tag, this._handleQueryLayout);
}

export class WebShape<
  P extends BaseProps = BaseProps,
  C = {}
> extends React.Component<P, C> {
  [x: string]: unknown;
  _remeasureMetricsOnActivation: () => void;
  touchableHandleStartShouldSetResponder?: (
    e: GestureResponderEvent,
  ) => boolean;
  touchableHandleResponderMove?: (e: GestureResponderEvent) => void;
  touchableHandleResponderGrant?: (e: GestureResponderEvent) => void;
  touchableHandleResponderRelease?: (e: GestureResponderEvent) => void;
  touchableHandleResponderTerminate?: (e: GestureResponderEvent) => void;
  touchableHandleResponderTerminationRequest?: (
    e: GestureResponderEvent,
  ) => boolean;
  constructor(props: P, context: C) {
    super(props, context);
    SvgTouchableMixin(this);
    this._remeasureMetricsOnActivation = remeasure.bind(this);
  }
}

export class Circle extends WebShape {
  render(): JSX.Element {
    return createElement('circle', prepare(this));
  }
}

export class ClipPath extends WebShape {
  render(): JSX.Element {
    return createElement('clipPath', prepare(this));
  }
}

export class Defs extends WebShape {
  render(): JSX.Element {
    return createElement('defs', prepare(this));
  }
}

export class Ellipse extends WebShape {
  render(): JSX.Element {
    return createElement('ellipse', prepare(this));
  }
}

export class G extends WebShape<
  BaseProps & {
    x?: NumberProp;
    y?: NumberProp;
    translate?: string;
  }
> {
  render(): JSX.Element {
    const { x, y, ...rest } = this.props;

    if ((x || y) && !rest.translate) {
      rest.translate = `${x || 0}, ${y || 0}`;
    }

    return createElement('g', prepare(this, rest));
  }
}

export class Image extends WebShape {
  render(): JSX.Element {
    return createElement('image', prepare(this));
  }
}

export class Line extends WebShape {
  render(): JSX.Element {
    return createElement('line', prepare(this));
  }
}

export class LinearGradient extends WebShape {
  render(): JSX.Element {
    return createElement('linearGradient', prepare(this));
  }
}

export class Path extends WebShape {
  render(): JSX.Element {
    return createElement('path', prepare(this));
  }
}

export class Polygon extends WebShape {
  render(): JSX.Element {
    return createElement('polygon', prepare(this));
  }
}

export class Polyline extends WebShape {
  render(): JSX.Element {
    return createElement('polyline', prepare(this));
  }
}

export class RadialGradient extends WebShape {
  render(): JSX.Element {
    return createElement('radialGradient', prepare(this));
  }
}

export class Rect extends WebShape {
  render(): JSX.Element {
    return createElement('rect', prepare(this));
  }
}

export class Stop extends WebShape {
  render(): JSX.Element {
    return createElement('stop', prepare(this));
  }
}

export class Svg extends WebShape {
  render(): JSX.Element {
    return createElement('svg', prepare(this));
  }
}

export class Symbol extends WebShape {
  render(): JSX.Element {
    return createElement('symbol', prepare(this));
  }
}

export class Text extends WebShape {
  render(): JSX.Element {
    return createElement('text', prepare(this));
  }
}

export class TSpan extends WebShape {
  render(): JSX.Element {
    return createElement('tspan', prepare(this));
  }
}

export class TextPath extends WebShape {
  render(): JSX.Element {
    return createElement('textPath', prepare(this));
  }
}

export class Use extends WebShape {
  render(): JSX.Element {
    return createElement('use', prepare(this));
  }
}

export class Mask extends WebShape {
  render(): JSX.Element {
    return createElement('mask', prepare(this));
  }
}

export class ForeignObject extends WebShape {
  render(): JSX.Element {
    return createElement('foreignObject', prepare(this));
  }
}

export class Marker extends WebShape {
  render(): JSX.Element {
    return createElement('marker', prepare(this));
  }
}

export class Pattern extends WebShape {
  render(): JSX.Element {
    return createElement('pattern', prepare(this));
  }
}

export default Svg;
