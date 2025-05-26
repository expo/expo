import React from 'react';
import { Text } from 'react-native';

import { router } from '../imperative-api';
import { renderRouter } from '../testing-library';
import { useFocusEffect } from '../useFocusEffect';

it('can use imperative API inside a useFocusEffect', () => {
  renderRouter({
    index: function Index() {
      useFocusEffect(() => {
        router.push('/second');
      });

      return null;
    },
    second: () => <Text>Second</Text>,
  });
});
