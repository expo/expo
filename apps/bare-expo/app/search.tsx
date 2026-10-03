import * as React from 'react';

import { optionalRequire } from '../optionalRequire';

const SearchScreen = optionalRequire(() =>
  require('native-component-list/src/screens/SearchScreen')
)?.default;

export default function SearchRoute() {
  return SearchScreen ? <SearchScreen /> : null;
}
