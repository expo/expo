import { spacing } from '@expo/styleguide-native';
import { View } from 'expo-dev-client-components';
import * as React from 'react';
import { StyleSheet, Image } from 'react-native';
import FadeIn from 'react-native-fade-in-image';

type Props = {
  image?: number | string | null;
};

export function AppIcon(props: Props) {
  const { image } = props;

  if (image !== undefined) {
    if (image === null) {
      return <View height="12" width="12" style={[styles.image, styles.emptyImage]} />;
    } else {
      const source = typeof image === 'number' ? image : { uri: image };
      return (
        <View
          border="default"
          rounded="small"
          height="12"
          width="12"
          style={[styles.imageContainer]}>
          <FadeIn>
            <Image source={source} style={[styles.image, { height: 47, width: 47 }]} />
          </FadeIn>
        </View>
      );
    }
  } else {
    return null;
  }
}

const styles = StyleSheet.create({
  imageContainer: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: spacing[2],
  },
  image: {
    borderRadius: 8,
  },
  emptyImage: {
    backgroundColor: '#eee',
  },
  iconContainer: {
    alignSelf: 'center',
    marginEnd: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 28,
  },
});
