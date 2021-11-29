import React, { Component } from 'react';
import {
  findNodeHandle,
  MeasureInWindowOnSuccessCallback,
  MeasureLayoutOnSuccessCallback,
  MeasureOnSuccessCallback,
  NativeModules,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import {
  ClipProps,
  Color,
  extractedProps,
  FillProps,
  NumberProp,
  ResponderInstanceProps,
  ResponderProps,
  StrokeProps,
  TransformProps,
} from '../lib/extract/types';
import extractResponder from '../lib/extract/extractResponder';
import extractViewBox from '../lib/extract/extractViewBox';
import extractColor from '../lib/extract/extractColor';
import Shape from './Shape';
import G from './G';
import { RNSVGSvg } from './NativeComponents';

const RNSVGSvgViewManager = NativeModules.RNSVGSvgViewManager;

const styles = StyleSheet.create({
  svg: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
});
const defaultStyle = styles.svg;

export default class Svg extends Shape<
  {
    color?: Color;
    viewBox?: string;
    opacity?: NumberProp;
    onLayout?: () => void;
    preserveAspectRatio?: string;
    style?: ViewStyle[] | ViewStyle;
  } & TransformProps &
    ResponderProps &
    StrokeProps &
    FillProps &
    ClipProps
> {
  static displayName = 'Svg';

  static defaultProps = {
    preserveAspectRatio: 'xMidYMid meet',
  };

  measureInWindow = (callback: MeasureInWindowOnSuccessCallback) => {
    const { root } = this;
    root && root.measureInWindow(callback);
  };

  measure = (callback: MeasureOnSuccessCallback) => {
    const { root } = this;
    root && root.measure(callback);
  };

  measureLayout = (
    relativeToNativeNode: number,
    onSuccess: MeasureLayoutOnSuccessCallback,
    onFail: () => void /* currently unused */,
  ) => {
    const { root } = this;
    root && root.measureLayout(relativeToNativeNode, onSuccess, onFail);
  };

  setNativeProps = (
    props: Object & {
      width?: NumberProp;
      height?: NumberProp;
      bbWidth?: NumberProp;
      bbHeight?: NumberProp;
    },
  ) => {
    const { width, height } = props;
    if (width) {
      props.bbWidth = width;
    }
    if (height) {
      props.bbHeight = height;
    }
    const { root } = this;
    root && root.setNativeProps(props);
  };

  toDataURL = (callback: () => void, options?: Object) => {
    if (!callback) {
      return;
    }
    const handle = findNodeHandle(this.root as Component);
    RNSVGSvgViewManager.toDataURL(handle, options, callback);
  };

  render() {
    const {
      style,
      opacity,
      viewBox,
      children,
      onLayout,
      preserveAspectRatio,
      ...extracted
    } = this.props;
    const stylesAndProps = {
      ...(Array.isArray(style) ? Object.assign({}, ...style) : style),
      ...extracted,
    };
    let {
      color,
      width,
      height,
      focusable,

      // Inherited G properties
      font,
      transform,
      fill,
      fillOpacity,
      fillRule,
      stroke,
      strokeWidth,
      strokeOpacity,
      strokeDasharray,
      strokeDashoffset,
      strokeLinecap,
      strokeLinejoin,
      strokeMiterlimit,
    } = stylesAndProps;
    if (width === undefined && height === undefined) {
      width = height = '100%';
    }

    const props: extractedProps = extracted as extractedProps;
    props.focusable = Boolean(focusable) && focusable !== 'false';
    const rootStyles: (ViewStyle | ViewStyle[])[] = [defaultStyle];

    if (style) {
      rootStyles.push(style);
    }

    let override = false;
    const overrideStyles: ViewStyle = {};
    const o = opacity != null ? +opacity : NaN;
    if (!isNaN(o)) {
      override = true;
      overrideStyles.opacity = o;
    }

    if (width && height) {
      override = true;
      const w = parseInt(width, 10);
      const h = parseInt(height, 10);
      const doNotParseWidth = isNaN(w) || width[width.length - 1] === '%';
      const doNotParseHeight = isNaN(h) || height[height.length - 1] === '%';
      overrideStyles.width = doNotParseWidth ? width : w;
      overrideStyles.height = doNotParseHeight ? height : h;
      overrideStyles.flex = 0;
    }

    if (override) {
      rootStyles.push(overrideStyles);
    }

    props.style = rootStyles.length > 1 ? rootStyles : defaultStyle;

    if (width != null) {
      props.bbWidth = width;
    }
    if (height != null) {
      props.bbHeight = height;
    }

    extractResponder(props, props, this as ResponderInstanceProps);

    const tint = extractColor(color);
    if (tint != null) {
      props.color = tint;
      props.tintColor = tint;
    }

    if (onLayout != null) {
      props.onLayout = onLayout;
    }

    return (
      <RNSVGSvg
        {...props}
        ref={this.refMethod}
        {...extractViewBox({ viewBox, preserveAspectRatio })}
      >
        <G
          {...{
            children,
            style,
            font,
            transform,
            fill,
            fillOpacity,
            fillRule,
            stroke,
            strokeWidth,
            strokeOpacity,
            strokeDasharray,
            strokeDashoffset,
            strokeLinecap,
            strokeLinejoin,
            strokeMiterlimit,
          }}
        />
      </RNSVGSvg>
    );
  }
}
