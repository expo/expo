import React from 'react';
import { Image, ImageSourcePropType } from 'react-native';
import { alignEnum, meetOrSliceTypes } from '../lib/extract/extractViewBox';
import { withoutXY } from '../lib/extract/extractProps';
import { NumberProp } from '../lib/extract/types';
import Shape from './Shape';
import { RNSVGImage } from './NativeComponents';

const spacesRegExp = /\s+/;

export default class SvgImage extends Shape<{
  preserveAspectRatio?: string;
  x?: NumberProp;
  y?: NumberProp;
  width?: NumberProp;
  height?: NumberProp;
  xlinkHref?: string | number | ImageSourcePropType;
  href?: string | number | ImageSourcePropType;
}> {
  static displayName = 'Image';

  static defaultProps = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    preserveAspectRatio: 'xMidYMid meet',
  };

  render() {
    const { props } = this;
    const {
      preserveAspectRatio,
      x,
      y,
      width,
      height,
      xlinkHref,
      href = xlinkHref,
    } = props;
    const modes = preserveAspectRatio
      ? preserveAspectRatio.trim().split(spacesRegExp)
      : [];
    const align = modes[0];
    const meetOrSlice: 'meet' | 'slice' | 'none' | string | undefined =
      modes[1];
    const imageProps = {
      x,
      y,
      width,
      height,
      meetOrSlice: meetOrSliceTypes[meetOrSlice] || 0,
      align: alignEnum[align] || 'xMidYMid',
      src: !href
        ? null
        : Image.resolveAssetSource(
            typeof href === 'string' ? { uri: href } : href,
          ),
    };
    return (
      <RNSVGImage
        ref={this.refMethod}
        {...withoutXY(this, props)}
        {...imageProps}
      />
    );
  }
}
