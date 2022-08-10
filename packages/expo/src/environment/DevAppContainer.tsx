import * as React from 'react';

import DevLoadingView from '../environment/DevLoadingView';

export default function DevAppContainer({ children }: { children?: React.ReactNode }) {
  return (
    <>
      {children}
      <DevLoadingView />
    </>
  );
}
