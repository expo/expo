import { Text } from 'expo-dev-client-components';
import * as React from 'react';
import { View as RNView, StyleSheet, Platform } from 'react-native';

import PlatformIcon from '../../../components/PlatformIcon';

type PlatformIconProps = React.ComponentProps<typeof PlatformIcon>;

type DevelopmentServerTitleProps = {
  title?: string;
  platform?: PlatformIconProps['platform'];
};

export function DevelopmentServerTitle({ title, platform }: DevelopmentServerTitleProps) {
  return title ? (
    <RNView style={styles.titleContainer}>
      {platform && <PlatformIcon platform={platform} />}
      <Text style={styles.titleText} ellipsizeMode="tail" numberOfLines={1}>
        {title}
      </Text>
    </RNView>
  ) : null;
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  titleText: {
    flex: 1,
    fontSize: 15,
    ...Platform.select({
      ios: {
        fontWeight: '500',
      },
      android: {
        fontWeight: '400',
        marginTop: 1,
      },
    }),
  },
});
