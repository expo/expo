import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useRoute, useTheme } from '@react-navigation/native';
import * as React from 'react';
import { Platform, Share, StyleSheet, Text, TouchableOpacity } from 'react-native';

import * as UrlUtils from '../utils/UrlUtils';

function ShareProjectButton(props: Partial<React.ComponentProps<typeof TouchableOpacity>>) {
  const theme = useTheme();
  const route = useRoute();
  const onPress = () => {
    const url = `exp://exp.host/@${route.params.username}/${route.params.slug}`;
    const message = UrlUtils.normalizeUrl(url);
    Share.share({
      title: url,
      message,
      url: message,
    });
  };

  return (
    <TouchableOpacity style={[styles.buttonContainer, props.style]} onPress={onPress}>
      {Platform.select({
        // ios: <Text style={{ fontSize: 17, color: theme.colors.primary }}>Share</Text>,
        ios: <Ionicons name="ios-share" size={27} color={theme.colors.primary} />,
        android: <Ionicons name="md-share" size={27} color={theme.colors.text} />,
      })}
    </TouchableOpacity>
  );
}

export default ShareProjectButton;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 15,
  },
});
