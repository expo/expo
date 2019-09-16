import { Platform, StyleSheet } from 'react-native';
import { Colors } from '../constants';
import { StackNavigatorConfig } from 'react-navigation-stack';

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.headerBackground,
  },
  headerTitle: {
    color: Colors.headerTitle,
  },
  card: {
    backgroundColor: Colors.greyBackground,
  },
});

const platformNavigationOptions = Platform.select({
  default: {},
  android: {
    headerStyle: {
      elevation: 0,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    }
  },
  web: {
    headerLayoutPreset: 'left',
  },
});

const StackConfig: StackNavigatorConfig = {
  cardStyle: styles.card,
  headerTransitionPreset: 'uikit',
  defaultNavigationOptions: () => ({
    headerStyle: styles.header,
    headerTintColor: Colors.tintColor,
    headerTitleStyle: styles.headerTitle,
    headerPressColorAndroid: Colors.tintColor,
    ...platformNavigationOptions,
  }),
};

export default StackConfig;
