import { Redirect } from 'expo-router';
import * as React from 'react';

import { getTestModules } from '../TestModules';
import { createQueryString } from '../screens/getScreenIdForLinking';

// Legacy deep-link form that runs every test, e.g. `test-suite://all`.
export default function All() {
  const tests = createQueryString(getTestModules().map((module) => module.name));
  return <Redirect href={{ pathname: '/run', params: { tests } }} />;
}
