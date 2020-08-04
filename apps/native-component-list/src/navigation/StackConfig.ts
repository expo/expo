import { HeaderStyleInterpolators } from '@react-navigation/stack';
import { Platform, StyleSheet } from 'react-native';

import { Colors } from '../constants';

const styles = StyleSheet.create({
  header: Platform.select({
    default: {
      backgroundColor: Colors.headerBackground,
    },
    android: {
      elevation: 0,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
  }),
  headerTitle: {
    color: Colors.headerTitle,
  },
  card: {
    backgroundColor: Colors.greyBackground,
  },
});

const StackConfig = {
  cardStyle: styles.card,
  screenOptions: () => ({
    headerStyleInterpolator: HeaderStyleInterpolators.forUIKit,
    headerStyle: styles.header,
    headerTintColor: Colors.tintColor,
    headerTitleStyle: styles.headerTitle,
    headerPressColorAndroid: Colors.tintColor,
  }),
};

export default StackConfig;
