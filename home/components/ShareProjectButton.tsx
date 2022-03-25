import { useTheme } from '@react-navigation/native';
import { useExpoTheme } from 'expo-dev-client-components';
import * as React from 'react';
import { Share, StyleSheet, TouchableOpacity } from 'react-native';

import FeatureFlags from '../FeatureFlags';
import Config from '../api/Config';
import * as UrlUtils from '../utils/UrlUtils';
import * as Icons from './Icons';

export default function ShareProjectButton(
  props: Partial<React.ComponentProps<typeof TouchableOpacity>> & {
    fullName: string;
  }
) {
  const theme = useTheme();
  const expoTheme = useExpoTheme();
  const onPress = React.useCallback(() => {
    const url = `exp://${Config.api.host}/${props.fullName}`;
    const message = UrlUtils.normalizeUrl(url);
    Share.share({
      title: url,
      message,
      url: message,
    });
  }, [props.fullName]);

  return (
    <TouchableOpacity style={[styles.container, props.style]} onPress={onPress}>
      <Icons.Share
        size={24}
        color={
          FeatureFlags.ENABLE_2022_NAVIGATION_REDESIGN
            ? expoTheme.icon.default
            : theme.colors.primary
        }
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 15,
  },
});
