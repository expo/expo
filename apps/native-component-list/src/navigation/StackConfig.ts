import { Platform, StyleSheet } from 'react-native';
import { StackNavigatorConfig } from 'react-navigation-stack';
import { Colors } from '../constants';

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.headerBackground,
    ...Platform.select({
      web: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0,0,0,0.1)',
        boxShadow: '',
      },
      default: {},
    }),
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
    },
  },
  web: {
    headerLayoutPreset: 'left',
  },
});

const StackConfig: StackNavigatorConfig = {
  cardStyle: styles.card,
  headerTransitionPreset: 'uikit',
  ...Platform.select({
    web: {
      headerMode: 'screen',
    },
    default: {},
  }),
  defaultNavigationOptions: () => ({
    headerStyle: styles.header,
    headerTintColor: Colors.tintColor,
    headerTitleStyle: styles.headerTitle,
    headerPressColorAndroid: Colors.tintColor,
    ...platformNavigationOptions,
  }),
};

export default StackConfig;
