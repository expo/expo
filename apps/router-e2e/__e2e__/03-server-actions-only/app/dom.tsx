'use dom';

import React from 'react';
import { Text } from 'react-native';

import { renderPage } from '../components/server-actions';

export default function ServerActionTest() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <React.Suspense fallback={<Text>Loading...</Text>}>
        {renderPage({ title: 'Hello!' })}
      </React.Suspense>
    </div>
  );
}
