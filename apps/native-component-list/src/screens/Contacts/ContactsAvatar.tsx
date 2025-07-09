import * as React from 'react';
import { Image, StyleProp, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

import Colors from '../../constants/Colors';

type Props = {
  image: (() => void) | string | any;
  onPress: () => void;
  name: string;
  style: StyleProp<ViewStyle>;
};
export default function Avatar({ image, name = '', style, onPress }: Props) {
  const getImage = (): React.ReactElement => {
    if (typeof image === 'string') {
      return <Image style={styles.image} source={{ uri: image }} />;
    } else if (typeof image === 'function') {
      return image();
    }
    return <Image source={{}} />;
  };

  const getInitials = () => {
    const _name = name.toUpperCase().split(' ');
    let initials;
    if (_name.length === 1) {
      initials = `${_name[0].charAt(0)}`;
    } else if (_name.length > 1) {
      initials = `${_name[0].charAt(0)}${_name[1].charAt(0)}`;
    } else {
      initials = '';
    }
    return initials;
  };

  return (
    <TouchableOpacity
      disabled={!onPress}
      onPress={() => onPress?.()}
      style={[styles.container, style]}>
      {image ? getImage() : <Text style={styles.text}>{getInitials()}</Text>}
    </TouchableOpacity>
  );
}

const DEFAULT_SIZE = 120;

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    width: DEFAULT_SIZE,
    aspectRatio: 1,
    borderRadius: DEFAULT_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: Colors.secondaryText,
  },
  avatarTransparent: {
    backgroundColor: '#B8B8B8',
  },
  image: {
    resizeMode: 'cover',
    width: '100%',
    height: '100%',
  },
  text: {
    color: 'white',
    fontSize: DEFAULT_SIZE * 0.35,
    backgroundColor: 'transparent',
    fontWeight: 'bold',
  },
});
