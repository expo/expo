// @flow

import React from 'react';
import { isMatch } from 'lodash';
import asyncRetry from 'async-retry';

export const waitFor = millis => new Promise(resolve => setTimeout(resolve, millis));

export const retryForStatus = (object, status) =>
  asyncRetry(
    async (bail, retriesCount) => {
      const readStatus = await object.getStatusAsync();
      if (isMatch(readStatus, status)) {
        return true;
      } else {
        const stringifiedStatus = JSON.stringify(status);
        const desiredError = `The A/V instance has not entered desired state (${stringifiedStatus}) after ${retriesCount} retries.`;
        const lastKnownError = `Last known state: ${JSON.stringify(readStatus)}.`;
        throw new Error(`${desiredError} ${lastKnownError}`);
      }
    },
    { retries: 5, minTimeout: 100 }
  );

export const mountAndWaitFor = (
  child: React.Node,
  propName = 'ref',
  setPortalChild: React.Node => void
) =>
  new Promise(resolve => {
    // `ref` prop is set directly in the child, not in the `props` object.
    // https://github.com/facebook/react/issues/8873#issuecomment-275423780
    const previousPropFunc = propName === 'ref' ? child.ref : child.props[propName];
    const newPropFunc = val => {
      previousPropFunc && previousPropFunc(val);
      resolve(val);
    };
    const clonedChild = React.cloneElement(child, { [propName]: newPropFunc });
    setPortalChild(clonedChild);
  });

export class TimeoutError extends Error {
  constructor(...args) {
    super(...args);
    this.name = 'TimeoutError';
  }
}

export const mountAndWaitForWithTimeout = (
  child: React.Node,
  propName = 'ref',
  setPortalChild: React.Node => void,
  timeout
) =>
  Promise.race([
    mountAndWaitFor(child, propName, setPortalChild),
    new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new TimeoutError(`mountAndWaitFor did not resolve after ${timeout} ms.`));
      }, timeout);
    }),
  ]);

export default {
  waitFor,
  TimeoutError,
  retryForStatus,
  mountAndWaitFor,
  mountAndWaitForWithTimeout,
};
