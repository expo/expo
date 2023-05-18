import React from 'react';
import { Platform } from 'react-native';

import ErrorToastContainer from './toast/ErrorToastContainer';

declare const process: any;

if (!global.setImmediate) {
  // @ts-expect-error: setImmediate is not defined in the global scope
  global.setImmediate = function (fn) {
    return setTimeout(fn, 0);
  };
}

if (process.env.NODE_ENV === 'development' && Platform.OS === 'web') {
  // Stack traces are big with React Navigation

  require('./LogBox').install();
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
