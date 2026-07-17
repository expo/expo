import * as React from 'react';

import { optionalRequire } from '../../../optionalRequire';

const RegistryScreenRoute = optionalRequire(() =>
  require('native-component-list/src/navigation/RegistryScreenRoute')
)?.default;
const findApiScreen = optionalRequire(() =>
  require('native-component-list/src/navigation/screenRegistry')
)?.findApiScreen;

export default function ApiScreenRoute() {
  if (!RegistryScreenRoute || !findApiScreen) {
    return null;
  }
  return <RegistryScreenRoute findScreen={findApiScreen} />;
}
