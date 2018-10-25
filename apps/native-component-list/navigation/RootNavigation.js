import { StyleSheet } from 'react-native';
import { createAppContainer, createStackNavigator } from 'react-navigation';

import MainTabNavigator from './MainTabNavigator';

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
  },
});

const RootNavigation = createStackNavigator(
  {
    MainTabs: MainTabNavigator,
  },
  {
    headerMode: 'none',
    initialRouteName: 'MainTabs',
    cardStyle: styles.card,
    defaultNavigationOptions: () => ({
      headerTitleStyle: {
        fontWeight: 'normal',
      },
    }),
  }
);

export default createAppContainer(RootNavigation);
