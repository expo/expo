import { Redirect, useLocalSearchParams } from 'expo-router';
import * as React from 'react';

import { createQueryString, getSelectedTestNames } from '../../screens/getScreenIdForLinking';

// Legacy deep-link form that runs a set of tests, e.g. `test-suite://select/basic,crypto`.
export default function SelectTests() {
  const { tests } = useLocalSearchParams<{ tests?: string | string[] }>();
  const raw = Array.isArray(tests) ? tests.join(',') : (tests ?? '');
  const query = createQueryString(getSelectedTestNames(decodeURIComponent(raw)));
  return <Redirect href={{ pathname: '/run', params: { tests: query } }} />;
}
