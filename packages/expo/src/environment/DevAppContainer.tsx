import * as React from 'react';

import DevLoadingView from '../environment/DevLoadingView';

export default function DevAppContainer({ children }: React.PropsWithChildren<object>) {
  return (
    <>
      {children}
      <DevLoadingView />
    </>
  );
}
