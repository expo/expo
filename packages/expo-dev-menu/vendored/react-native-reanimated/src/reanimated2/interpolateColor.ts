import {
  hsvToColor,
  RGBtoHSV,
  rgbaColor,
  processColor,
  red,
  green,
  blue,
  opacity,
} from './Colors';
import { makeMutable } from './core';
import { interpolate } from './interpolation';
// @ts-ignore JS file
import { Extrapolate } from '../reanimated1/derived';
import { SharedValue } from './commonTypes';
import { useSharedValue } from './hook/useSharedValue';

export type InterpolationOptions = {
  gamma?: number;
  useCorrectedHSVInterpolation?: boolean;
};

const interpolateColorsHSV = (
  value: number,
  inputRange: readonly number[],
  colors: InterpolateHSV,
  options: InterpolationOptions
) => {
  'worklet';
  let h = 0;
  const { useCorrectedHSVInterpolation = true } = options;
  if (useCorrectedHSVInterpolation) {
    // if the difference between hues in a range is > 180 deg
    // then move the hue at the right end of the range +/- 360 deg
    // and add the next point in the original place + 0.00001 with original hue
    // to not break the next range
    const correctedInputRange = [inputRange[0]];
    const originalH = colors.h;
    const correctedH = [originalH[0]];

    for (let i = 1; i < originalH.length; ++i) {
      const d = originalH[i] - originalH[i - 1];
      if (originalH[i] > originalH[i - 1] && d > 0.5) {
        correctedInputRange.push(inputRange[i]);
        correctedInputRange.push(inputRange[i] + 0.00001);
        correctedH.push(originalH[i] - 1);
        correctedH.push(originalH[i]);
      } else if (originalH[i] < originalH[i - 1] && d < -0.5) {
        correctedInputRange.push(inputRange[i]);
        correctedInputRange.push(inputRange[i] + 0.00001);
        correctedH.push(originalH[i] + 1);
        correctedH.push(originalH[i]);
      } else {
        correctedInputRange.push(inputRange[i]);
        correctedH.push(originalH[i]);
      }
    }
    h =
      (interpolate(value, correctedInputRange, correctedH, Extrapolate.CLAMP) +
        1) %
      1;
  } else {
    h = interpolate(value, inputRange, colors.h, Extrapolate.CLAMP);
  }
  const s = interpolate(value, inputRange, colors.s, Extrapolate.CLAMP);
  const v = interpolate(value, inputRange, colors.v, Extrapolate.CLAMP);
  const a = interpolate(value, inputRange, colors.a, Extrapolate.CLAMP);
  return hsvToColor(h, s, v, a);
};

const toLinearSpace = (x: number[], gamma: number): number[] => {
  'worklet';
  return x.map((v) => Math.pow(v / 255, gamma));
};

const toGammaSpace = (x: number, gamma: number): number => {
  'worklet';
  return Math.round(Math.pow(x, 1 / gamma) * 255);
};

const interpolateColorsRGB = (
  value: number,
  inputRange: readonly number[],
  colors: InterpolateRGB,
  options: InterpolationOptions
) => {
  'worklet';
  const { gamma = 2.2 } = options;
  let { r: outputR, g: outputG, b: outputB } = colors;
  if (gamma !== 1) {
    outputR = toLinearSpace(outputR, gamma);
    outputG = toLinearSpace(outputG, gamma);
    outputB = toLinearSpace(outputB, gamma);
  }
  const r = interpolate(value, inputRange, outputR, Extrapolate.CLAMP);
  const g = interpolate(value, inputRange, outputG, Extrapolate.CLAMP);
  const b = interpolate(value, inputRange, outputB, Extrapolate.CLAMP);
  const a = interpolate(value, inputRange, colors.a, Extrapolate.CLAMP);
  if (gamma === 1) {
    return rgbaColor(r, g, b, a);
  }
  return rgbaColor(
    toGammaSpace(r, gamma),
    toGammaSpace(g, gamma),
    toGammaSpace(b, gamma),
    a
  );
};

interface InterpolateRGB {
  r: number[];
  g: number[];
  b: number[];
  a: number[];
}

const getInterpolateRGB = (
  colors: readonly (string | number)[]
): InterpolateRGB => {
  'worklet';

  const r = [];
  const g = [];
  const b = [];
  const a = [];
  for (let i = 0; i < colors.length; ++i) {
    const color = colors[i];
    const processedColor = processColor(color);
    // explicit check in case if processedColor is 0
    if (processedColor !== null && processedColor !== undefined) {
      r.push(red(processedColor));
      g.push(green(processedColor));
      b.push(blue(processedColor));
      a.push(opacity(processedColor));
    }
  }
  return { r, g, b, a };
};

interface InterpolateHSV {
  h: number[];
  s: number[];
  v: number[];
  a: number[];
}

const getInterpolateHSV = (
  colors: readonly (string | number)[]
): InterpolateHSV => {
  'worklet';
  const h = [];
  const s = [];
  const v = [];
  const a = [];
  for (let i = 0; i < colors.length; ++i) {
    const color = colors[i];
    const processedColor = processColor(color) as any;
    if (typeof processedColor === 'number') {
      const processedHSVColor = RGBtoHSV(
        red(processedColor),
        green(processedColor),
        blue(processedColor)
      );

      h.push(processedHSVColor.h);
      s.push(processedHSVColor.s);
      v.push(processedHSVColor.v);
      a.push(opacity(processedColor));
    }
  }
  return { h, s, v, a };
};

export const interpolateColor = (
  value: number,
  inputRange: readonly number[],
  outputRange: readonly (string | number)[],
  colorSpace: 'RGB' | 'HSV' = 'RGB',
  options: InterpolationOptions = {}
): string | number => {
  'worklet';
  if (colorSpace === 'HSV') {
    return interpolateColorsHSV(
      value,
      inputRange,
      getInterpolateHSV(outputRange),
      options
    );
  } else if (colorSpace === 'RGB') {
    return interpolateColorsRGB(
      value,
      inputRange,
      getInterpolateRGB(outputRange),
      options
    );
  }
  throw new Error(
    `Invalid color space provided: ${colorSpace}. Supported values are: ['RGB', 'HSV']`
  );
};

export enum ColorSpace {
  RGB = 0,
  HSV = 1,
}

export interface InterpolateConfig {
  inputRange: readonly number[];
  outputRange: readonly (string | number)[];
  colorSpace: ColorSpace;
  cache: SharedValue<InterpolateRGB | InterpolateHSV | null>;
  options: InterpolationOptions;
}

export function useInterpolateConfig(
  inputRange: readonly number[],
  outputRange: readonly (string | number)[],
  colorSpace = ColorSpace.RGB,
  options: InterpolationOptions = {}
): SharedValue<InterpolateConfig> {
  return useSharedValue({
    inputRange,
    outputRange,
    colorSpace,
    cache: makeMutable<InterpolateRGB | InterpolateHSV | null>(null),
    options,
  });
}

export const interpolateSharableColor = (
  value: number,
  interpolateConfig: SharedValue<InterpolateConfig>
): string | number => {
  'worklet';
  let colors = interpolateConfig.value.cache.value;
  if (interpolateConfig.value.colorSpace === ColorSpace.RGB) {
    if (!colors) {
      colors = getInterpolateRGB(interpolateConfig.value.outputRange);
      interpolateConfig.value.cache.value = colors;
    }
    return interpolateColorsRGB(
      value,
      interpolateConfig.value.inputRange,
      colors as InterpolateRGB,
      interpolateConfig.value.options
    );
  } else if (interpolateConfig.value.colorSpace === ColorSpace.HSV) {
    if (!colors) {
      colors = getInterpolateHSV(interpolateConfig.value.outputRange);
      interpolateConfig.value.cache.value = colors;
    }
    return interpolateColorsHSV(
      value,
      interpolateConfig.value.inputRange,
      colors as InterpolateHSV,
      interpolateConfig.value.options
    );
  }
  throw new Error(
    `Invalid color space provided: ${interpolateConfig.value.colorSpace}. Supported values are: ['RGB', 'HSV']`
  );
};
