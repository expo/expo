import { NavigationContainer } from '@react-navigation/native';
import * as React from 'react';

import { App } from './App';

export default function ExpoStoryApp({ title = '' }) {
  return (
    <NavigationContainer>
      <App title={title} />
    </NavigationContainer>
  );
}
