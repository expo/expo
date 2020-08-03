import { useRoute, useTheme } from '@react-navigation/native';
import * as React from 'react';
import { Share, StyleSheet, TouchableOpacity } from 'react-native';

import * as UrlUtils from '../utils/UrlUtils';
import * as Icons from './Icons';

export default function ShareProjectButton(
  props: Partial<React.ComponentProps<typeof TouchableOpacity>>
) {
  const theme = useTheme();
  const route = useRoute();
  const onPress = React.useCallback(() => {
    const { username, slug } = route.params as any;
    const url = `exp://exp.host/@${username}/${slug}`;
    const message = UrlUtils.normalizeUrl(url);
    Share.share({
      title: url,
      message,
      url: message,
    });
  }, [route.params]);

  return (
    <TouchableOpacity style={[styles.container, props.style]} onPress={onPress}>
      <Icons.Share size={24} color={theme.colors.primary} />
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
