import * as React from 'react';
import { InitialProps } from './withExpoRoot.types';

export default function withExpoRoot<P extends InitialProps>(
  AppRootComponent: React.ComponentClass<P>
): React.ComponentClass<P> {
  // TODO: Bacon: Add notifications
  // TODO: Bacon: Add RootErrorBoundary (rethink for web)
  return AppRootComponent;
}
