'use client';

import React from 'react';
import { Text } from 'react-native';

import { renderPage } from '../components/functions';

export default function ServerActionTest() {
  const memo = React.useMemo(() => renderPage(), []);

  return (
    <React.Suspense
      fallback={
        <Text style={{ backgroundColor: 'darkcyan', padding: 16 }}>Root Suspense Fallback...</Text>
      }>
      {memo}
    </React.Suspense>
  );
}
