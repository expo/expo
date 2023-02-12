import type { StackScreenProps } from '@react-navigation/stack';
import React from 'react';
import { FlatList, View } from 'react-native';

import ExamplesListItem from '../components/ExamplesListItem';
import { CONCRETE_EXAMPLE_SCREENS } from '../constants/ConcreteExampleScreens';
import { ExamplesStackNavigatorProps } from '../navigators/MainNavigator';

type ExamplesListScreenProps = StackScreenProps<ExamplesStackNavigatorProps, 'ExamplesListScreen'>;

export default function ExamplesListScreen({ navigation }: ExamplesListScreenProps) {
  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={CONCRETE_EXAMPLE_SCREENS}
        renderItem={({ item }) => (
          <ExamplesListItem
            key={item.name}
            name={item.name}
            onExampleSelect={() => {
              navigation.navigate(item.name);
            }}
          />
        )}
        contentContainerStyle={{ paddingVertical: 15 }}
      />
    </View>
  );
}
