import React from 'react';
import { View, Text } from 'react-native';

import Shared from '../shared';

const B = React.lazy(async () => import('./b'));

export default function A() {
  return (
    <View>
      <Text>A</Text>
      <B />
      <Shared />
    </View>
  );
}
