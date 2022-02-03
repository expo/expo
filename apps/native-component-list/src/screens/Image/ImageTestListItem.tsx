import { StackNavigationProp } from '@react-navigation/stack';
import * as React from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors } from '../../constants';
import { getImageComponent, getSelectedCompareComponent } from './ImageComponents';
import ImageTestView from './ImageTestView';
import { resolveProps } from './resolveProps';
import { ImageTest, Links } from './types';

type PropsType = {
  navigation: StackNavigationProp<Links>;
  test: ImageTest;
  tests: ImageTest[];
  animValue?: Animated.Value;
};

export default function ImageTestListItem({ test, animValue, tests, navigation }: PropsType) {
  const onPress = () => {
    navigation.push('ImageTest', {
      test,
      tests,
    });
  };

  const imageProps = resolveProps(test.props, animValue);
  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.5} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title}>{test.name}</Text>
      </View>
      <View style={styles.content}>
        <ImageTestView
          style={styles.image}
          imageProps={imageProps}
          ImageComponent={getImageComponent()}
          loadOnDemand={test.loadOnDemand}
        />
        <View style={styles.spacer} />
        <ImageTestView
          style={styles.image}
          imageProps={imageProps}
          ImageComponent={getSelectedCompareComponent()}
          loadOnDemand={test.loadOnDemand}
        />
      </View>
    </TouchableOpacity>
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
