import React from 'react';
import { Image, Text, TouchableOpacity, StyleSheet } from 'react-native';

import Colors from '../../constants/Colors';

export default class Avatar extends React.PureComponent {
  get image() {
    const { image } = this.props;
    let source = image;
    if (typeof image === 'string') {
      source = { uri: image };
    } else if (typeof image === 'function') {
      return image();
    }
    return <Image style={styles.image} source={source} />;
  }

  get initials() {
    const _name = this.props.name || '';
    const name = _name.toUpperCase().split(' ');
    let initials;
    if (name.length === 1) {
      initials = `${name[0].charAt(0)}`;
    } else if (name.length > 1) {
      initials = `${name[0].charAt(0)}${name[1].charAt(0)}`;
    } else {
      initials = '';
    }
    return initials;
  }
  get text() {
    return <Text style={styles.text}>{this.initials}</Text>;
  }

  onPress = () => this.props.onPress && this.props.onPress();

  get contents() {
    return this.props.image ? this.image : this.text;
  }

  render() {
    const { onPress, style } = this.props;

    return (
      <TouchableOpacity
        disabled={!onPress}
        onPress={this.onPress}
        accessibilityTraits="image"
        style={[styles.container, style]}>
        {this.contents}
      </TouchableOpacity>
    );
  }
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
