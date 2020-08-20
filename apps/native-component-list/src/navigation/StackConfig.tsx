import { Ionicons } from '@expo/vector-icons';
import { HeaderStyleInterpolators } from '@react-navigation/stack';
import * as React from 'react';
import { Platform, StyleSheet, TouchableOpacity } from 'react-native';

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

const StackConfig = ({ navigation }) => ({
  cardStyle: styles.card,
  screenOptions: () => ({
    headerStyleInterpolator: HeaderStyleInterpolators.forUIKit,
    headerStyle: styles.header,
    headerTintColor: Colors.tintColor,
    headerTitleStyle: styles.headerTitle,
    headerPressColorAndroid: Colors.tintColor,
    headerRight: () => (
      <TouchableOpacity onPress={() => navigation.navigate('search')} style={{ marginRight: 16 }}>
        <Ionicons
          name="md-search"
          size={Platform.OS === 'ios' ? 22 : 25}
          color={Colors.tintColor}
        />
      </TouchableOpacity>
    ),
  }),
});

export default StackConfig;
