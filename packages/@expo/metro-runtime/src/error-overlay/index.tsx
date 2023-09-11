import React from 'react';
// TODO: This will break tree shaking due to how we transpile this package.
import { Platform } from 'react-native';

import ErrorToastContainer from './toast/ErrorToastContainer';

declare const process: any;

if (!global.setImmediate) {
  global.setImmediate = function (fn) {
    return setTimeout(fn, 0);
  };
}

if (process.env.NODE_ENV === 'development') {
  if (Platform.OS === 'web') {
    // Stack traces are big with React Navigation

    require('./LogBox').default.install();
  }
}

export function withErrorOverlay(Comp: React.ComponentType<any>) {
  if (process.env.NODE_ENV === 'production') {
    return Comp;
  }
  return function ErrorOverlay(props: any) {
    return (
      <ErrorToastContainer>
        <Comp {...props} />
      </ErrorToastContainer>
    );
  };
}
