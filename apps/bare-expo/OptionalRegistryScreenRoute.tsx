import * as React from 'react';

import { optionalRequire } from './optionalRequire';

const RegistryScreenRoute = optionalRequire(() =>
  require('native-component-list/src/navigation/RegistryScreenRoute')
)?.default;
const screenRegistry = optionalRequire(() =>
  require('native-component-list/src/navigation/screenRegistry')
);

// Resolves an NCL registry screen for a catch-all deep-link id, or renders nothing when NCL isn't bundled.
export function OptionalRegistryScreenRoute({
  find,
}: {
  find: 'findApiScreen' | 'findComponentScreen';
}) {
  const findScreen = screenRegistry?.[find];
  if (!RegistryScreenRoute || !findScreen) {
    return null;
  }
  return <RegistryScreenRoute findScreen={findScreen} />;
}
