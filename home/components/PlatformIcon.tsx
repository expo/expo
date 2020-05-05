import * as React from 'react';
import { Platform, View, StyleSheet } from 'react-native';

import { Ionicons } from './Icons';

type Props = {
  platform: 'native' | 'web';
};

export default function PlatformIcon(props: Props) {
  const { platform } = props;
  let icon: React.ReactNode = null;
  if (platform === 'native') {
    icon = Platform.select({
      android: <Ionicons name="logo-android" size={17} lightColor="#000" />,
      ios: <Ionicons name="logo-apple" size={17} lightColor="#000" />,
      default: <Ionicons name="md-tablet-portrait" size={15} lightColor="#000" />,
    });
  } else if (platform === 'web') {
    icon = <Ionicons name="ios-globe" size={15} lightColor="#000" />;
  }

  return <View style={styles.container}>{icon}</View>;
}

const styles = StyleSheet.create({
  container: {
    width: 17,
  },
});
