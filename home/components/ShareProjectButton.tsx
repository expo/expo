import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useNavigation, useRoute, useTheme } from '@react-navigation/native';
import * as React from 'react';
import { Platform, Share, StyleSheet, Text, TouchableOpacity } from 'react-native';

import * as UrlUtils from '../utils/UrlUtils';

function ShareProjectButton() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const onPress = () => {
    const url = `https://expo.io/@${route.params.username}/${route.params.slug}`;
    const message = UrlUtils.normalizeUrl(url);
    Share.share({
      title: url,
      message,
      url: message,
    });
  };

  return (
    <TouchableOpacity style={styles.buttonContainer} onPress={onPress}>
      {Platform.select({
        ios: <Text style={{ fontSize: 17, color: theme.colors.primary }}>Share</Text>,
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 15,
  },
});
