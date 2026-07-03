import { Redirect, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { createQueryString, getSelectedTestNames } from 'test-suite/screens/getScreenIdForLinking';

// Legacy deep-link form that runs a set of tests, e.g. `bareexpo://test-suite/select/basic,crypto`.
export default function SelectTests() {
  const { tests } = useLocalSearchParams<{ tests?: string | string[] }>();
  const raw = Array.isArray(tests) ? tests.join(',') : (tests ?? '');
  const query = createQueryString(getSelectedTestNames(decodeURIComponent(raw)));
  return <Redirect href={{ pathname: '/test-suite/run', params: { tests: query } }} />;
}
