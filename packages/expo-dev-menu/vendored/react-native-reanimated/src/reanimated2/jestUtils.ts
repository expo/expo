// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { jestResetJsReanimatedModule } from './core';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toHaveAnimatedStyle(
        style: Record<string, unknown>[] | Record<string, unknown>
      ): R;
    }
  }
}

let config = {
  fps: 60,
};

const isAnimatedStyle = (style) => {
  return !!style.animatedStyle;
};

const getAnimatedStyleFromObject = (style) => {
  return style.animatedStyle.current.value;
};

const getCurrentStyle = (received) => {
  const styleObject = received.props.style;
  let currentStyle = {};
  if (Array.isArray(styleObject)) {
    received.props.style.forEach((style) => {
      if (isAnimatedStyle(style)) {
        currentStyle = {
          ...currentStyle,
          ...getAnimatedStyleFromObject(style),
        };
      } else {
        currentStyle = {
          ...currentStyle,
          ...style,
        };
      }
    });
  } else {
    if (isAnimatedStyle(styleObject)) {
      currentStyle = getAnimatedStyleFromObject(styleObject);
    } else {
      currentStyle = {
        ...styleObject,
        ...received.props.animatedStyle.value,
      };
    }
  }
  return currentStyle;
};

const checkEqual = (currentStyle, expectStyle) => {
  if (Array.isArray(expectStyle)) {
    if (expectStyle.length !== currentStyle.length) return false;
    for (let i = 0; i < currentStyle.length; i++) {
      if (!checkEqual(currentStyle[i], expectStyle[i])) {
        return false;
      }
    }
  } else if (typeof currentStyle === 'object' && currentStyle) {
    for (const property in expectStyle) {
      if (!checkEqual(currentStyle[property], expectStyle[property])) {
        return false;
      }
    }
  } else {
    return currentStyle === expectStyle;
  }
  return true;
};

const findStyleDiff = (current, expect, requireAllMatch) => {
  const diffs = [];
  let isEqual = true;
  for (const property in expect) {
    if (!checkEqual(current[property], expect[property])) {
      isEqual = false;
      diffs.push({
        property: property,
        current: current[property],
        expect: expect[property],
      });
    }
  }

  if (
    requireAllMatch &&
    Object.keys(current).length !== Object.keys(expect).length
  ) {
    isEqual = false;
    for (const property in current) {
      if (expect[property] === undefined) {
        diffs.push({
          property: property,
          current: current[property],
          expect: expect[property],
        });
      }
    }
  }

  return { isEqual, diffs };
};

const compareStyle = (received, expectedStyle, config) => {
  if (!received.props.style) {
    return { message: () => message, pass: false };
  }
  const { exact } = config;
  const currentStyle = getCurrentStyle(received);
  const { isEqual, diffs } = findStyleDiff(currentStyle, expectedStyle, exact);

  if (isEqual) {
    return { message: () => 'ok', pass: true };
  }

  const currentStyleStr = JSON.stringify(currentStyle);
  const expectedStyleStr = JSON.stringify(expectedStyle);
  const differences = diffs
    .map(
      (diff) =>
        `- '${diff.property}' should be ${JSON.stringify(
          diff.expect
        )}, but is ${JSON.stringify(diff.current)}`
    )
    .join('\n');

  return {
    message: () =>
      `Expected: ${expectedStyleStr}\nReceived: ${currentStyleStr}\n\nDifferences:\n${differences}`,
    pass: false,
  };
};

let frameTime = 1000 / config.fps;
let requestAnimationFrameCopy;
let currentTimestamp = 0;

const requestAnimationFrame = (callback) => {
  setTimeout(callback, frameTime);
};

const beforeTest = () => {
  jestResetJsReanimatedModule();
  requestAnimationFrameCopy = global.requestAnimationFrame;
  global.requestAnimationFrame = requestAnimationFrame;
  global.ReanimatedDataMock = {
    now: () => currentTimestamp,
  };
  currentTimestamp = 0;
  jest.useFakeTimers();
};

const afterTest = () => {
  jest.useRealTimers();
  global.requestAnimationFrame = requestAnimationFrameCopy;
};

const tickTravel = () => {
  currentTimestamp += frameTime;
  jest.advanceTimersByTime(frameTime);
};

export const withReanimatedTimer = (animationTest) => {
  beforeTest();
  animationTest();
  afterTest();
};

export const advanceAnimationByTime = (time = frameTime) => {
  for (let i = 0; i <= Math.ceil(time / frameTime); i++) {
    tickTravel();
  }
  jest.advanceTimersByTime(frameTime);
};

export const advanceAnimationByFrame = (count) => {
  for (let i = 0; i <= count; i++) {
    tickTravel();
  }
  jest.advanceTimersByTime(frameTime);
};

export const setUpTests = (userConfig = {}) => {
  let expect = global.expect;
  if (expect === undefined) {
    const expectModule = require('expect');
    expect = expectModule;
    // Starting from Jest 28, "expect" package uses named exports instead of default export.
    // So, requiring "expect" package doesn't give direct access to "expect" function anymore.
    // It gives access to the module object instead.
    // We use this info to detect if the project uses Jest 28 or higher.
    if (typeof expect === 'object') {
      const jestGlobals = require('@jest/globals');
      expect = jestGlobals.expect;
    }
    if (expect === undefined || expect.extend === undefined) {
      expect = expectModule.default;
    }
  }

  require('setimmediate');
  frameTime = Math.round(1000 / config.fps);

  config = {
    ...config,
    ...userConfig,
  };

  expect.extend({
    toHaveAnimatedStyle(received, expectedStyle, config = {}) {
      return compareStyle(received, expectedStyle, config);
    },
  });
};

export const getAnimatedStyle = (received) => {
  return getCurrentStyle(received);
};
