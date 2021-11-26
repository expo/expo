import React, { Children, ReactElement } from 'react';

import extractColor from './extractColor';
import extractOpacity from './extractOpacity';
import extractTransform from './extractTransform';
import { TransformProps } from './types';
import units from '../units';

const percentReg = /^([+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)(%?)$/;

function percentToFloat(
  percent:
    | number
    | string
    | {
        __getAnimatedValue: () => number;
      },
): number {
  if (typeof percent === 'number') {
    return percent;
  }
  if (
    typeof percent === 'object' &&
    typeof percent.__getAnimatedValue === 'function'
  ) {
    return percent.__getAnimatedValue();
  }
  const matched = typeof percent === 'string' && percent.match(percentReg);
  if (!matched) {
    console.warn(`"${percent}" is not a valid number or percentage string.`);
    return 0;
  }

  return matched[2] ? +matched[1] / 100 : +matched[1];
}

const offsetComparator = (object: number[], other: number[]) =>
  object[0] - other[0];

export default function extractGradient(
  props: {
    id?: string;
    children?: ReactElement[];
    transform?: number[] | string | TransformProps;
    gradientTransform?: number[] | string | TransformProps;
    gradientUnits?: 'objectBoundingBox' | 'userSpaceOnUse';
  } & TransformProps,
  parent: {},
) {
  const { id, children, gradientTransform, transform, gradientUnits } = props;
  if (!id) {
    return null;
  }

  const stops = [];
  const childArray = children
    ? Children.map(children, child =>
        React.cloneElement(child, {
          parent,
        }),
      )
    : [];
  const l = childArray.length;
  for (let i = 0; i < l; i++) {
    const {
      props: {
        style,
        offset = style && style.offset,
        stopColor = (style && style.stopColor) || '#000',
        stopOpacity = style && style.stopOpacity,
      },
    } = childArray[i];
    const offsetNumber = percentToFloat(offset || 0);
    const color = stopColor && extractColor(stopColor);
    if (typeof color !== 'number' || isNaN(offsetNumber)) {
      console.warn(
        `"${stopColor}" is not a valid color or "${offset}" is not a valid offset`,
      );
      continue;
    }
    const alpha = Math.round(extractOpacity(stopOpacity) * 255);
    stops.push([offsetNumber, (color & 0x00ffffff) | (alpha << 24)]);
  }
  stops.sort(offsetComparator);

  const gradient = [];
  const k = stops.length;
  for (let j = 0; j < k; j++) {
    const s = stops[j];
    gradient.push(s[0], s[1]);
  }

  return {
    name: id,
    gradient,
    children: childArray,
    gradientUnits: (gradientUnits && units[gradientUnits]) || 0,
    gradientTransform: extractTransform(
      gradientTransform || transform || props,
    ),
  };
}
