import { Text } from 'expo-dev-client-components';
import * as React from 'react';
import { View as RNView, StyleSheet } from 'react-native';

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
      <Text style={{ flex: 1 }} type="InterSemiBold" ellipsizeMode="tail" numberOfLines={1}>
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
});
