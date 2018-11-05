import { StyleSheet } from 'react-native';
import { createStackNavigator } from 'react-navigation';

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
    navigationOptions: () => ({
      headerTitleStyle: {
        fontWeight: 'normal',
      },
    }),
  }
);

export default RootNavigation;
