import { spacing } from '@expo/styleguide-native';
import { View } from 'expo-dev-client-components';
import * as React from 'react';
import { StyleSheet, Image } from 'react-native';
import FadeIn from 'react-native-fade-in-image';

import { Ionicons } from '../../../components/Icons';
import Colors from '../../../constants/Colors';

type IconProps = React.ComponentProps<typeof Ionicons>;

type DevelopmentServerImageProps = {
  icon?: IconProps['name'];
  iconStyle?: IconProps['style'];
  image?: number | string | null;
};

export function DevelopmentServerImage(props: DevelopmentServerImageProps) {
  const { icon, iconStyle, image } = props;

  if (image !== undefined) {
    if (image === null) {
      return <View height="8" width="8" style={[styles.image, styles.emptyImage]} />;
    } else {
      const source = typeof image === 'number' ? image : { uri: image };
      return (
        <View border="default" rounded="small" height="8" width="8" style={[styles.imageContainer]}>
          <FadeIn>
            <Image source={source} style={[styles.image, { height: 31, width: 31 }]} />
          </FadeIn>
        </View>
      );
    }
  } else if (icon) {
    return (
      <View height="8" width="8" style={[styles.iconContainer]}>
        <Ionicons
          style={[styles.icon, iconStyle]}
          name={icon}
          lightColor={Colors.light.text}
          darkColor="#fff"
        />
      </View>
    );
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
