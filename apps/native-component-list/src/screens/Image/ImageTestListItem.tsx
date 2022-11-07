import ExpoImage from 'expo-image';
import * as React from 'react';
import { Animated, Dimensions, StyleSheet, Text, View, Image as RNImage } from 'react-native';

import { Colors } from '../../constants';
import ImageTestView from './ImageTestView';
import { resolveProps } from './resolveProps';
import { ImageTest } from './types';

type PropsType = {
  test: ImageTest;
  animValue?: Animated.Value;
};

export default function ImageTestListItem({ test, animValue }: PropsType) {
  const imageProps = resolveProps(test.props, animValue);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{test.name}</Text>
      </View>
      <View style={styles.content}>
        <ImageTestView
          style={styles.image}
          imageProps={imageProps}
          ImageComponent={ExpoImage}
          loadOnDemand={test.loadOnDemand}
        />
        <View style={styles.spacer} />
        <ImageTestView
          style={styles.image}
          imageProps={imageProps}
          ImageComponent={RNImage}
          loadOnDemand={test.loadOnDemand}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 160,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'white',
    borderBottomColor: Colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  header: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    color: Colors.disabled,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  spacer: {
    width: 10,
  },
  image: {
    width: (Dimensions.get('window').width - 30) / 2,
    height: 160 - 10 - 32,
  },
});
