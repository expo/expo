// In order to keep bundle size down, we treat this file as a polyfill for Web.

import { shouldBeUseWeb } from '../PlatformChecker';

if (shouldBeUseWeb()) {
  global._frameTimestamp = null;
  global._setGlobalConsole = (_val) => {
    // noop
  };
  global._measure = () => {
    console.warn(
      "[Reanimated] You can't use `measure` with Chrome Debugger or with web version"
    );
    return {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      pageX: 0,
      pageY: 0,
    };
  };
  global._scrollTo = () => {
    console.warn(
      "[Reanimated] You can't use `scrollTo` with Chrome Debugger or with web version"
    );
  };
  global._setGestureState = () => {
    console.warn(
      "[Reanimated] You can't use `setGestureState` with Chrome Debugger or with web version"
    );
  };
}
