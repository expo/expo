import React from 'react';
import { View, Text } from 'react-native';

import A from './a';
import Shared from '../shared';

export default function B() {
  console.log(A);
  return (
    <View>
      <Text>B</Text>;
      <Shared />
    </View>
  );
}
