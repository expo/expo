import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import * as React from 'react';
import { useSafeArea } from 'react-native-safe-area-context';

import TabIcon from '../components/TabIcon';
import ReactNativeCore from '../screens/ReactNativeCore/ReactNativeCoreScreen';
import StackConfig from './StackConfig';

const Stack = createStackNavigator();

function ReactNativeCoreStackNavigator(props: { navigation: BottomTabNavigationProp<any> }) {
  const { right } = useSafeArea();

  return (
    <Stack.Navigator {...props} {...StackConfig}>
      <Stack.Screen
        name="ReactNativeCore"
        options={{
          title: 'React Native Core',
          cardStyle: { paddingRight: right },
        }}
        component={ReactNativeCore}
      />
    </Stack.Navigator>
  );
}
const icon = ({ focused }: { focused: boolean }) => {
  return <TabIcon name="react" focused={focused} />;
};
ReactNativeCoreStackNavigator.navigationOptions = {
  title: 'React Native Core',
  tabBarLabel: 'React Native',
  tabBarIcon: icon,
  drawerIcon: icon,
};
export default ReactNativeCoreStackNavigator;
