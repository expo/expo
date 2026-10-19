import * as React from 'react';

import { optionalRequire } from '../../../optionalRequire';

const ExpoApis = optionalRequire(() =>
  require('native-component-list/src/screens/ExpoApisScreen')
)?.default;
const screenApiItems = optionalRequire(() =>
  require('native-component-list/src/navigation/apiScreens')
)?.screenApiItems;

export default function ApisIndex() {
  return ExpoApis ? <ExpoApis apis={screenApiItems} /> : null;
}
