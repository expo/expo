import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import * as React from 'react';

import TabIcon from '../components/TabIcon';
import ReactNativeCore from '../screens/ReactNativeCore/ReactNativeCoreScreen';
import StackConfig from './StackConfig';

const Stack = createStackNavigator();

function ReactNativeCoreStackNavigator(props: { navigation: BottomTabNavigationProp<any> }) {
  React.useLayoutEffect(() => {
    props.navigation.setOptions({
      title: 'React Native Core',
      tabBarLabel: 'React Native',
      tabBarIcon: ({ focused }: { focused: boolean }) => {
        return <TabIcon name="react" focused={focused} />;
      },
    });
  }, [props.navigation]);
  return (
    <Stack.Navigator {...props} {...StackConfig}>
      <Stack.Screen
        name="ReactNativeCore"
        options={{ title: 'React Native Core' }}
        component={ReactNativeCore}
      />
    </Stack.Navigator>
  );
}
export default ReactNativeCoreStackNavigator;
