/* global _WORKLET _measure _scrollTo _setGestureState */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Component } from 'react';
import { findNodeHandle } from 'react-native';
import { RefObjectFunction } from './commonTypes';
import { shouldBeUseWeb } from './PlatformChecker';

export function getTag(
  view: null | number | React.Component<any, any> | React.ComponentClass<any>
): null | number {
  return findNodeHandle(view);
}

export interface MeasuredDimensions {
  x: number;
  y: number;
  width: number;
  height: number;
  pageX: number;
  pageY: number;
}

const isNativeIndefined = shouldBeUseWeb();

export function measure(
  animatedRef: RefObjectFunction<Component>
): MeasuredDimensions {
  'worklet';
  if (!_WORKLET || isNativeIndefined) {
    console.warn(
      '[reanimated.measure] method cannot be used for web or Chrome Debugger'
    );
    return {
      x: NaN,
      y: NaN,
      width: NaN,
      height: NaN,
      pageX: NaN,
      pageY: NaN,
    };
  }
  const viewTag = animatedRef();
  const result = _measure(viewTag);
  if (result.x === -1234567) {
    throw new Error(`The view with tag ${viewTag} could not be measured`);
  }
  if (isNaN(result.x)) {
    console.warn(
      'Trying to measure a component which gets view-flattened on Android. To disable view-flattening, set `collapsable={false}` on this component.'
    );
  }
  return result;
}

export function scrollTo(
  animatedRef: RefObjectFunction<Component>,
  x: number,
  y: number,
  animated: boolean
): void {
  'worklet';
  if (!_WORKLET || isNativeIndefined) {
    return;
  }
  const viewTag = animatedRef();
  _scrollTo(viewTag, x, y, animated);
}

export function setGestureState(handlerTag: number, newState: number): void {
  'worklet';
  if (!_WORKLET || isNativeIndefined) {
    console.warn(
      '[Reanimated] You can not use setGestureState in non-worklet function.'
    );
    return;
  }
  _setGestureState(handlerTag, newState);
}
