import { createStackNavigator } from '@react-navigation/stack';
import * as React from 'react';

import { BranchesScreen } from './BranchesScreen';
import { ExtensionsScreen } from './ExtensionsScreen';
import { UpdatesScreen } from './UpdatesScreen';

export type ExtensionsStackParamList = {
  Extensions: undefined;
  Branches: undefined;
  Updates: {
    branchName: string;
  };
};

const Extensions = createStackNavigator<ExtensionsStackParamList, 'extensions'>();

export function ExtensionsStack() {
  return (
    <Extensions.Navigator
      id="extensions"
      screenOptions={{ headerMode: 'float', gestureEnabled: false }}
      detachInactiveScreens={false}>
      <Extensions.Screen
        name="Extensions"
        component={ExtensionsScreen}
        options={{ headerShown: false }}
      />
      <Extensions.Screen
        name="Branches"
        options={{ headerTitle: 'EAS Update' }}
        component={BranchesScreen}
      />
      <Extensions.Screen
        name="Updates"
        options={{ headerTitle: 'Branch' }}
        component={UpdatesScreen}
      />
    </Extensions.Navigator>
  );
}
