'use client';
import React from 'react';
import { Text } from 'react-native';

import { renderNestedAsync } from './nested-action';

export default function NestedClientTest() {
  return (
    <React.Suspense fallback={<Text>Loading nested...</Text>}>{renderNestedAsync()}</React.Suspense>
  );
}
