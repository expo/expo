import * as React from 'react';

import RegistryScreenRoute from '../../../navigation/RegistryScreenRoute';
import { findComponentScreen } from '../../../navigation/screenRegistry';

export default function ComponentScreenRoute() {
  return <RegistryScreenRoute findScreen={findComponentScreen} />;
}
