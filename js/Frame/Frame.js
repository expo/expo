/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule Frame
 * @flow weak
 */
'use strict';

import React, { PropTypes } from 'react';
import ReactNative, {
  NativeModules,
  Platform,
  StyleSheet,
  View,
  requireNativeComponent,
} from 'react-native';

import ExponentKernel from 'ExponentKernel';

const { EXFrameManager, UIManager } = NativeModules;

export default class Frame extends React.Component {
  static propTypes = {
    ...View.propTypes,
    /**
     * The URL of the experience to load in the frame.
     */
    initialUri: PropTypes.string,
    /**
     * The URL of the bundle to load in the frame.
     */
    source: PropTypes.string,
    /**
     * The name of the registered application to load in the frame.
     */
    applicationKey: PropTypes.string,
    /**
     * Deprecated alias for applicationKey.
     */
    module: PropTypes.string,
    /**
     * Host for Chrome debugger.
     */
    debuggerHostname: PropTypes.string,
    debuggerPort: PropTypes.number,
    /**
     * Manifest of the experience represented by the given source.
     */
    manifest: PropTypes.object,
    /**
     * Initial props to pass to the root component of the Frame's experience.
     * These will all be under the `exp` property.
     */
    initialProps: PropTypes.object,
    /**
     * Event handler that is invoked when the frame begins loading its source
     * code.
     */
    onLoadingStart: PropTypes.func,
    /**
     * Event handler that is invoked when the frame successfully completes
     * loading its source code. If the source code has an error, this event still
     * fires.
     */
    onLoadingFinish: PropTypes.func,
    /**
     * Event handler that is invoked when the frame fails to load its source code.
     *
     * nativeEvent = {domain, code, description, reason, stack?}
     */
    onLoadingError: PropTypes.func,
    /**
     * Event handler that is invoked when the JavaScript in the frame throws an
     * uncaught error.
     *
     * nativeEvent = {id, message, stack, fatal?}
     */
    onError: PropTypes.func,
  };

  reload() {
    if (Platform.OS === 'android') {
      UIManager.dispatchViewManagerCommand(
        ReactNative.findNodeHandle(this._frame),
        UIManager.EXFrame.Commands.reload,
        []
      );
    } else {
      EXFrameManager.reload(ReactNative.findNodeHandle(this._frame));
    }
  }

  render() {
    return (
      <ExFrame
        {...this.props}
        ref={component => {
          this._frame = component;
        }}
        style={[styles.frame, this.props.style]}
      />
    );
  }
}

let ExFrame;
if (Platform.OS === 'android') {
  ExFrame = requireNativeComponent('EXFrame', null);
} else {
  ExFrame = requireNativeComponent('EXFrame', Frame);
}

let styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
  },
});
