// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import JSReanimated from './JSReanimated';
import { shouldBeUseWeb } from '../PlatformChecker';

const reanimatedJS = new JSReanimated();

if (shouldBeUseWeb()) {
  global._frameTimestamp = null;
  global._setGlobalConsole = (_val) => {
    // noop
  };
  global._measure = () => {
    console.warn(
      "[Reanimated] You can't use 'measue' method with Chrome Debugger or with web version"
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
      "[Reanimated] You can't use 'scrollTo' method with Chrome Debugger or with web version"
    );
  };
}

export const _updatePropsJS = (updates, viewRef) => {
  if (viewRef?._component) {
    const [rawStyles] = Object.keys(updates).reduce(
      (acc, key) => {
        const value = updates[key];
        const index = typeof value === 'function' ? 1 : 0;
        acc[index][key] = value;
        return acc;
      },
      [{}, {}]
    );

    if (typeof viewRef._component.setNativeProps === 'function') {
      setNativeProps(viewRef._component, rawStyles);
    } else if (Object.keys(viewRef._component.props).length > 0) {
      Object.keys(viewRef._component.props).forEach((key) => {
        if (!rawStyles[key]) {
          return;
        }
        const dashedKey = key.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
        viewRef._component._touchableNode.setAttribute(
          dashedKey,
          rawStyles[key]
        );
      });
    } else {
      console.warn('It is not possible to manipulate component');
    }
  }
};

const setNativeProps = (component, style) => {
  const previousStyle = component.previousStyle ? component.previousStyle : {};
  const currentStyle = { ...previousStyle, ...style };
  component.previousStyle = currentStyle;
  component.setNativeProps({ style: currentStyle });
};

export default reanimatedJS;
