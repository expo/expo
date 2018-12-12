import { StyleSheet } from 'react-native';

import { Colors } from '../constants';

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

const StackConfig = {
  cardStyle: styles.card,
  headerTransitionPreset: 'uikit',
  defaultNavigationOptions: () => ({
    headerStyle: styles.header,
    headerTintColor: Colors.tintColor,
    headerTitleStyle: styles.headerTitle,
    headerPressColorAndroid: Colors.tintColor,
  }),
};

export default StackConfig;
