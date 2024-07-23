import React from 'react';
import { View, Text } from 'react-native';

import B from './b';
import Shared from '../shared';

export default function C() {
  console.log(B);
  return (
    <View>
      <Text>C</Text>;
      <Shared />
    </View>
  );
}
