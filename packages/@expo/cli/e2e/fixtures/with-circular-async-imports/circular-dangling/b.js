import React from 'react';
import { View, Text } from 'react-native';

import Shared from '../shared';

const C = React.lazy(async () => import('./c'));

export default function B() {
  return (
    <View>
      <Text>B</Text>
      <C />
      <Shared />
    </View>
  );
}
