import * as React from 'react';

import RegistryScreenRoute from '../../../navigation/RegistryScreenRoute';
import { findApiScreen } from '../../../navigation/screenRegistry';

export default function ApiScreenRoute() {
  return <RegistryScreenRoute findScreen={findApiScreen} />;
}
