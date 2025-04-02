import React from 'react';
import { View, StyleSheet } from 'react-native';

import CustomUrlForm from '../../components/CustomUrlForm';

export const CustomLoaderScreen = () => {
  return (
    <View style={styles.container}>
      <CustomUrlForm />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
});
