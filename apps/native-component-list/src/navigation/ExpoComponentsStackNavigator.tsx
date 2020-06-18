import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import * as React from 'react';

import TabIcon from '../components/TabIcon';
import { Layout } from '../constants';
import ExpoComponents from '../screens/ExpoComponentsScreen';
import { Screens } from './ExpoComponents';
import LoadAssetsNavigationWrapper from './LoadAssetsNavigationWrapper';
import StackConfig from './StackConfig';

const Stack = createStackNavigator();

function ExpoComponentsStackNavigator(props: { navigation: BottomTabNavigationProp<any> }) {
  React.useLayoutEffect(() => {
    props.navigation.setOptions({
      title: 'Expo Components',
      tabBarLabel: 'Components',
      tabBarIcon: ({ focused }: { focused: boolean }) => {
        return <TabIcon name="cards-playing-outline" focused={focused} />;
      },
    });
  }, [props.navigation]);
  return (
    <Stack.Navigator {...props} {...StackConfig}>
      <Stack.Screen
        name="ExpoComponents"
        options={{ title: Layout.isSmallDevice ? 'Expo SDK Components' : 'Components in Expo SDK' }}
        component={ExpoComponents}
      />
      {Object.keys(Screens).map(name => (
        <Stack.Screen
          name={name}
          key={name}
          component={Screens[name]}
          options={(Screens[name] as any).navigationOptions ?? {}}
        />
      ))}
    </Stack.Navigator>
  );
}
export default LoadAssetsNavigationWrapper(ExpoComponentsStackNavigator);
