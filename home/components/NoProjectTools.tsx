import * as React from 'react';
import { Linking } from 'react-native';

import ListItem from './ListItem';

export default function NoProjectTools() {
  const handlePressAsync = async () => {
    Linking.openURL('https://docs.expo.io/get-started/installation/');
  };
  return (
    <ListItem
      title="Get started with Expo"
      subtitle="Run projects from expo-cli or Snack."
      onPress={handlePressAsync}
      last
    />
  );
}
