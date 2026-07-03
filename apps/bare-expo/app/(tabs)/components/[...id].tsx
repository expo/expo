import * as React from 'react';

import { optionalRequire } from '../../../optionalRequire';

const RegistryScreenRoute = optionalRequire(() =>
  require('native-component-list/src/navigation/RegistryScreenRoute')
)?.default;
const findComponentScreen = optionalRequire(() =>
  require('native-component-list/src/navigation/screenRegistry')
)?.findComponentScreen;

export default function ComponentScreenRoute() {
  if (!RegistryScreenRoute || !findComponentScreen) {
    return null;
  }
  return <RegistryScreenRoute findScreen={findComponentScreen} />;
}
