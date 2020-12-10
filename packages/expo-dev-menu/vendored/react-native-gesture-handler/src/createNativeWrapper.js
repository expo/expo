import React from 'react';

import NativeViewGestureHandler from './NativeViewGestureHandler';

/*
 * This array should consist of:
 *   - All keys in propTypes from NativeGestureHandler
 *     (and all keys in GestureHandlerPropTypes)
 *   - 'onGestureHandlerEvent'
 *   - 'onGestureHandlerStateChange'
 */
const NATIVE_WRAPPER_PROPS_FILTER = [
  'id',
  'minPointers',
  'enabled',
  'waitFor',
  'simultaneousHandlers',
  'shouldCancelWhenOutside',
  'hitSlop',
  'onGestureEvent',
  'onHandlerStateChange',
  'onBegan',
  'onFailed',
  'onCancelled',
  'onActivated',
  'onEnded',
  'shouldActivateOnStart',
  'disallowInterruption',
  'onGestureHandlerEvent',
  'onGestureHandlerStateChange',
];

export default function createNativeWrapper(Component, config = {}) {
  const ComponentWrapper = React.forwardRef((props, ref) => {
    // filter out props that should be passed to gesture handler wrapper
    const gestureHandlerProps = Object.keys(props).reduce(
      (res, key) => {
        if (NATIVE_WRAPPER_PROPS_FILTER.indexOf(key) !== -1) {
          res[key] = props[key];
        }
        return res;
      },
      { ...config } // watch out not to modify config
    );
    return (
      <NativeViewGestureHandler {...gestureHandlerProps}>
        <Component {...props} ref={ref} />
      </NativeViewGestureHandler>
    );
  });

  ComponentWrapper.propTypes = {
    ...Component.propTypes,
  };
  ComponentWrapper.displayName = Component.displayName || 'ComponentWrapper';

  return ComponentWrapper;
}
