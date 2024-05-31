import React from 'react';
import { View } from 'react-native';

const CircularEntrypoints = React.lazy(() => import('./circular-entrypoints/a'));
const CircularDangling = React.lazy(() => import('./circular-dangling/a'));

export default () => (
  <View>
    <CircularEntrypoints />
    <CircularDangling />
  </View>
);
