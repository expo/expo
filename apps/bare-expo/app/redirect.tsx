import * as React from 'react';

import { optionalRequire } from '../optionalRequire';

const RedirectScreen = optionalRequire(() =>
  require('native-component-list/src/screens/RedirectScreen')
)?.default;

export default function RedirectRoute() {
  return RedirectScreen ? <RedirectScreen /> : null;
}
