import { Platform, StyleSheet } from 'react-native';
import { Colors } from '../constants';
import { StackNavigatorConfig } from 'react-navigation';

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
  web: {
    headerLayoutPreset: 'left',
  },
});

const StackConfig: StackNavigatorConfig = {
  cardStyle: styles.card,
  headerTransitionPreset: 'uikit',
  defaultNavigationOptions: () => ({
    ...platformNavigationOptions,
    headerStyle: styles.header,
    headerTintColor: Colors.tintColor,
    headerTitleStyle: styles.headerTitle,
    headerPressColorAndroid: Colors.tintColor,
  }),
};

export default StackConfig;
