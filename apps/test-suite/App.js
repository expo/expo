import * as React from 'react';

import ModulesProvider from './ModulesProvider';
import RootNavigation from './navigation/RootNavigation';

export default () => (
  <ModulesProvider>
    <RootNavigation />
  </ModulesProvider>
);
