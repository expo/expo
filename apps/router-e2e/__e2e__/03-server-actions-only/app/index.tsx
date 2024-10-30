'use client';
import React from 'react';
import { Text } from 'react-native';

import { renderPage } from '../components/server-actions';

export default function ServerActionTest() {
  return (
    <React.Suspense fallback={<Text>Loading...</Text>}>
      {renderPage({ title: 'Hello!' })}
    </React.Suspense>
  );
}
