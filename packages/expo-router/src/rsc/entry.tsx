/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use client';

import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Router } from './router/client';
import { ErrorBoundary } from '../views/ErrorBoundary';
import { ErrorBoundaryProps, Try } from '../views/Try';

// Add root error recovery.
function RootErrorBoundary(props: ErrorBoundaryProps) {
  React.useEffect(() => {
    function refetchRoute() {
      if (props.error) {
        props.retry();
      }
    }
    // TODO: Only strip when not connected to a dev server.
    if (process.env.NODE_ENV === 'development') {
      globalThis.__EXPO_RSC_RELOAD_LISTENERS__ ||= [];
      const index = globalThis.__EXPO_RSC_RELOAD_LISTENERS__.indexOf(
        globalThis.__EXPO_REFETCH_ROUTE__
      );
      if (index !== -1) {
        globalThis.__EXPO_RSC_RELOAD_LISTENERS__.splice(index, 1, refetchRoute);
      } else {
        globalThis.__EXPO_RSC_RELOAD_LISTENERS__.unshift(refetchRoute);
      }
      globalThis.__EXPO_REFETCH_ROUTE__ = refetchRoute;
    }
  }, [props.error, props.retry]);

  return <ErrorBoundary error={props.error} retry={props.retry} />;
}

// Must be exported or Fast Refresh won't update the context
export function App() {
  return (
    <SafeAreaProvider>
      <Try catch={RootErrorBoundary}>
        <Router />
      </Try>
    </SafeAreaProvider>
  );
}
