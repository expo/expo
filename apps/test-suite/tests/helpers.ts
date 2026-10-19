import React, { type ReactElement } from 'react';
import { Alert } from 'react-native';

import type { SetPortalChild } from '../types';

export const waitFor = (millis: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, millis));

export const alertAndWaitForResponse = async (message: string) =>
  new Promise<void>((resolve) => {
    Alert.alert(message, undefined, [{ text: 'OK', onPress: () => resolve() }]);
  });

/** Resolves with the value `child`'s `propName` callback receives. */
export const mountAndWaitFor = <T = unknown>(
  child: ReactElement<any>,
  propName = 'ref',
  setPortalChild: SetPortalChild
) =>
  new Promise<T>((resolve) => {
    // `ref` prop is set directly in the child, not in the `props` object.
    // https://github.com/facebook/react/issues/8873#issuecomment-275423780
    const previousPropFunc: ((val: T) => void) | undefined =
      propName === 'ref' ? (child as { ref?: (val: T) => void }).ref : child.props[propName];
    const newPropFunc = (val: T) => {
      previousPropFunc?.(val);
      resolve(val);
    };
    const clonedChild = React.cloneElement(child, { [propName]: newPropFunc });
    setPortalChild(clonedChild);
  });

export class TimeoutError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export const mountAndWaitForWithTimeout = <T = unknown>(
  child: ReactElement<any>,
  propName = 'ref',
  setPortalChild: SetPortalChild,
  timeout: number
) =>
  Promise.race([
    mountAndWaitFor<T>(child, propName, setPortalChild),
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError(`mountAndWaitFor did not resolve after ${timeout} ms.`));
      }, timeout);
    }),
  ]);
