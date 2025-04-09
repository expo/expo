import React from 'react';

if (process.env.NODE_ENV === 'development' && process.env.EXPO_OS === 'web') {
  // Stack traces are big with React Navigation
  require('./LogBox').default.install();
}

export function withErrorOverlay(Comp: React.ComponentType<any>) {
  if (process.env.NODE_ENV === 'production') {
    return Comp;
  }

  const { default: ErrorToastContainer } = require('./ErrorToast') as typeof import('./ErrorToast');

  return function ErrorOverlay(props: any) {
    return (
      <ErrorToastContainer>
        <Comp {...props} />
      </ErrorToastContainer>
    );
  };
}
