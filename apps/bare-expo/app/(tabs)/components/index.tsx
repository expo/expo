import * as React from 'react';

import { optionalRequire } from '../../../optionalRequire';

const ExpoComponents = optionalRequire(() =>
  require('native-component-list/src/screens/ExpoComponentsScreen')
)?.default;
const screenApiItems = optionalRequire(() =>
  require('native-component-list/src/navigation/componentScreens')
)?.screenApiItems;

export default function ComponentsIndex() {
  return ExpoComponents ? <ExpoComponents apis={screenApiItems} /> : null;
}
