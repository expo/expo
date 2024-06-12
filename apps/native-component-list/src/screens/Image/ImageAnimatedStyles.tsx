import * as React from 'react';
import { Animated, StyleSheet, Switch, Text, View } from 'react-native';

import { ImageComparisonBody } from './ImageComparisonScreen';
import imageTests from './tests';
import { anyAnimationDriver, jsOnlyAnimationDriver } from './tests/constants';
import Button from '../../components/Button';
import Colors from '../../constants/Colors';

export default function ImageAnimatedStyles() {
  const targetValue = React.useRef(1);
  const animValue = React.useRef(new Animated.Value(0)).current;
  const [useNativeDriver, setUseNativeDriver] = React.useState(false);

  const sections = imageTests.tests.map((test) => ({
    title: test.name,
    data: test.tests.filter((it) => {
      return (
        it.animationDriver === anyAnimationDriver ||
        (it.animationDriver === jsOnlyAnimationDriver && !useNativeDriver)
      );
    }),
  }));

  return (
    <View style={styles.container}>
      <View style={styles.topContent}>
        <Text style={styles.text}>
          use native animation driver (set this before running animations)
        </Text>
        <Switch value={useNativeDriver} onValueChange={setUseNativeDriver} />
      </View>
      <Button
        title="start animation"
        onPress={() => {
          Animated.timing(animValue, {
            toValue: targetValue.current,
            duration: 2000,
            useNativeDriver,
          }).start(({ finished }) => {
            if (finished) {
              targetValue.current = targetValue.current === 1 ? 0 : 1;
            }
          });
        }}
      />

      <ImageComparisonBody sections={sections} useAnimatedComponent animValue={animValue} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.greyBackground,
  },
  text: {
    flexShrink: 1,
  },
  topContent: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 4,
    borderBottomColor: Colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
  },
});
