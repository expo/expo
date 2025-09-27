import React from 'react';

if (process.env.NODE_ENV === 'development' && process.env.EXPO_OS === 'web') {
  // Stack traces are big with React Navigation
  require('./LogBox').default.install();
}

export function withErrorOverlay(RootComponent: React.ComponentType<any>) {
  if (process.env.NODE_ENV === 'development' && process.env.EXPO_OS === 'web') {
    const ErrorToastContainer = require('./ErrorToast')
      .default as typeof import('./ErrorToast').default;

    return function ErrorOverlay(props: any) {
      return (
        <ErrorToastContainer>
          <RootComponent {...props} />
        </ErrorToastContainer>
      );
    };
  }

  return RootComponent;
}
