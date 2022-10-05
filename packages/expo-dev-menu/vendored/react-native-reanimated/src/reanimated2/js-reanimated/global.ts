// In order to keep bundle size down, we treat this file as a polyfill for Web.

import { shouldBeUseWeb } from '../PlatformChecker';
const initializeGlobalsForWeb = () => {
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
  return true;
};

/*
  If a file doesn't export anything, tree shaking doesn't pack 
  it into the JS bundle. In effect, the code inside of this file 
  will never execute. That is why we wrapped initialization code 
  into a function, and we call this one during creating 
  the module export object.
*/

export default initializeGlobalsForWeb();
