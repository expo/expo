'use client';
import React from 'react';
import { Text } from 'react-native';

import { renderPage } from '../components/server-actions';

const cached = React.cache(renderPage);

export default function ServerActionTest() {
  // Test hooks to ensure they don't break the export.
  const [isLoading, setLoading] = React.useState(true);

  const memo = React.useMemo(() => cached({ title: 'Hello!' }), []);
  console.log('memo', memo);
  return (
    <React.Suspense fallback={<Text style={{ backgroundColor: 'green' }}>Loading...</Text>}>
      {memo}
    </React.Suspense>
  );
}
