import { Redirect } from 'expo-router';
import * as React from 'react';
import { getTestModules } from 'test-suite/TestModules';
import { createQueryString } from 'test-suite/screens/getScreenIdForLinking';

// Legacy deep-link form that runs every test, e.g. `bareexpo://test-suite/all`.
export default function All() {
  const tests = createQueryString(getTestModules().map((module) => module.name));
  return <Redirect href={{ pathname: '/test-suite/run', params: { tests } }} />;
}
