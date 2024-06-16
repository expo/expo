import * as React from 'react';
import { Platform, View, StyleSheet } from 'react-native';

import { Ionicons } from './Icons';

type Props = {
  platform: 'native' | 'web';
};

const style = Platform.select({
  android: { marginTop: 3 },
  default: {},
});

export default function PlatformIcon(props: Props) {
  const { platform } = props;
  let icon: React.ReactNode = null;
  if (platform === 'native') {
    icon = Platform.select({
      android: <Ionicons name="logo-android" size={17} lightColor="#000" style={style} />,
      ios: <Ionicons name="logo-apple" size={17} lightColor="#000" style={style} />,
      default: <Ionicons name="tablet-portrait" size={15} lightColor="#000" style={style} />,
    });
  } else if (platform === 'web') {
    icon = <Ionicons name="globe" size={15} lightColor="#000" style={style} />;
  }

  return <View style={styles.container}>{icon}</View>;
}

const styles = StyleSheet.create({
  container: {
    width: 17,
  },
});
