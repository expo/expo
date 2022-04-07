import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

const Extensions = createStackNavigator<ExtensionsStackParamList>();

export function ExtensionsStack() {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <Extensions.Navigator headerMode="float">
      <Extensions.Screen
        name="Extensions"
        component={ExtensionsScreen}
        options={{ headerShown: false }}
      />
      <Extensions.Screen
        name="Branches"
        options={{ headerTitle: 'EAS Update', headerStatusBarHeight: safeAreaInsets.top }}
        component={BranchesScreen}
      />
      <Extensions.Screen
        name="Updates"
        options={{ headerTitle: 'Branch', headerStatusBarHeight: safeAreaInsets.top }}
        component={UpdatesScreen}
      />
    </Extensions.Navigator>
  );
}
