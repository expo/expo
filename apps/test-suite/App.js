import * as React from 'react';
import RootNavigation from './navigation/RootNavigation';

import ModulesProvider from './ModulesProvider';

export default () => (
  <ModulesProvider>
    <RootNavigation />
  </ModulesProvider>
);
