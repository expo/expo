import * as React from 'react';

import DevLoadingView from '../environment/DevLoadingView';

export function withDevTools<TComponent extends React.ComponentType<any>>(
  AppRootComponent: TComponent
): React.ComponentType<React.ComponentProps<TComponent>> {
  function WithDevTools(props: React.ComponentProps<TComponent>) {
    return (
      <>
        <AppRootComponent {...props} />
        <DevLoadingView />
      </>
    );
  }

  if (process.env.NODE_ENV !== 'production') {
    const name = AppRootComponent.displayName || AppRootComponent.name || 'Anonymous';
    WithDevTools.displayName = `withDevTools(${name})`;
  }

  return WithDevTools;
}
