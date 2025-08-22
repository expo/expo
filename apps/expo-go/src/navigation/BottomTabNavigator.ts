import { createNativeBottomTabNavigator } from '@bottom-tabs/react-navigation';
import { darkTheme, lightTheme } from '@expo/styleguide-native';
import { TypedNavigator } from '@react-navigation/native';
import { ComponentProps } from 'react';

const BottomTabNavigator: TypedNavigator<any, object> = createNativeBottomTabNavigator();
export default BottomTabNavigator;

export const getNavigatorProps = (props: {
  theme: string;
}): Partial<ComponentProps<typeof BottomTabNavigator.Navigator>> => ({
  tabBarStyle: {
    backgroundColor:
      props.theme === 'dark' ? darkTheme.background.default : lightTheme.background.default,
  },
  tabBarActiveTintColor: props.theme === 'dark' ? darkTheme.link.default : lightTheme.link.default,
  tabBarInactiveTintColor:
    props.theme === 'dark' ? darkTheme.icon.default : lightTheme.icon.default,
});
