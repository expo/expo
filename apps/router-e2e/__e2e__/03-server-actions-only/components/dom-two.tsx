'use dom';

import React from 'react';
import { Text } from 'react-native';

import { renderPageTwo } from './server-actions-two';

export default function ServerActionTest(_: { dom?: import('expo/dom').DOMProps }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <React.Suspense fallback={<Text>Loading...</Text>}>
        {renderPageTwo({ title: 'Hello!' })}
      </React.Suspense>
    </div>
  );
}
