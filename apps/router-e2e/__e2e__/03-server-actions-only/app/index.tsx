'use client';
import React from 'react';
import { Text } from 'react-native';

import { renderPage } from '../components/server-actions';

export default function ServerActionTest() {
  // Test hooks to ensure they don't break the export.
  const [isLoading, setLoading] = React.useState(true);

  return (
    <React.Suspense fallback={<Text>Loading...</Text>}>
      {renderPage({ title: 'Hello!' })}
    </React.Suspense>
  );
}
