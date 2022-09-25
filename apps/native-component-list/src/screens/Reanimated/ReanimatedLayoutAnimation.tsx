import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import Animated, {
  FadeIn,
  FlipInXUp,
  FlipInYLeft,
  FlipInXDown,
  FlipInYRight,
  FlipInEasyX,
  FlipInEasyY,
  FlipOutXUp,
  FlipOutYLeft,
  FlipOutXDown,
  FlipOutYRight,
  FlipOutEasyX,
  FlipOutEasyY,
} from 'react-native-reanimated';

interface AnimatedBlockProps {
  name: string;
  animatedStyle: Record<string, any>;
  defaultShow?: boolean;
}

const AnimatedBlock = ({ name, animatedStyle, defaultShow }: AnimatedBlockProps) => {
  const [show, setShow] = useState(defaultShow);
  return (
    <View style={styles.animatedBox}>
      {show ? (
        <TouchableWithoutFeedback onPress={() => setShow(!show)}>
          <Animated.View style={styles.animatedBlock} {...animatedStyle}>
            <Text style={styles.animatedText}>{name}</Text>
          </Animated.View>
        </TouchableWithoutFeedback>
      ) : null}
      {!show ? (
        <Animated.View entering={'entering' in animatedStyle ? undefined : FadeIn.delay(350)}>
          <TouchableOpacity style={styles.animatedBlockPlaceholder} onPress={() => setShow(!show)}>
            <Text style={styles.animatedTextPlaceholder}>{name}</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : null}
    </View>
  );
};

export default function ReanimatedLayoutAnimation() {
  return (
    <ScrollView style={{ flexDirection: 'column' }}>
      <Text style={styles.groupText}>Flip in</Text>
      <AnimatedBlock name="FlipInYRight" animatedStyle={{ entering: FlipInYRight }} />
      <AnimatedBlock name="FlipInYLeft" animatedStyle={{ entering: FlipInYLeft }} />
      <AnimatedBlock name="FlipInXUp" animatedStyle={{ entering: FlipInXUp }} />
      <AnimatedBlock name="FlipInXDown" animatedStyle={{ entering: FlipInXDown }} />
      <AnimatedBlock name="FlipInEasyX" animatedStyle={{ entering: FlipInEasyX }} />
      <AnimatedBlock name="FlipInEasyY" animatedStyle={{ entering: FlipInEasyY }} />

      <Text style={styles.groupText}>Flip out</Text>
      <AnimatedBlock name="FlipOutYRight" animatedStyle={{ exiting: FlipOutYRight }} />
      <AnimatedBlock name="FlipOutYLeft" animatedStyle={{ exiting: FlipOutYLeft }} />
      <AnimatedBlock name="FlipOutXUp" animatedStyle={{ exiting: FlipOutXUp }} />
      <AnimatedBlock name="FlipOutXDown" animatedStyle={{ exiting: FlipOutXDown }} />
      <AnimatedBlock name="FlipOutEasyX" animatedStyle={{ exiting: FlipOutEasyX }} />
      <AnimatedBlock name="FlipOutEasyY" animatedStyle={{ exiting: FlipOutEasyY }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  groupText: {
    fontSize: 20,
    paddingTop: 5,
    paddingLeft: 5,
    paddingBottom: 5,
  },
  animatedBlock: {
    height: 60,
    width: 300,
    borderWidth: 3,
    borderColor: '#001a72',
    backgroundColor: '#001a72',
    alignItems: 'center',
    justifyContent: 'center',
  },
  animatedTextPlaceholder: {
    color: '#001a72',
    fontSize: 20,
  },
  animatedBlockPlaceholder: {
    height: 60,
    width: 300,
    borderWidth: 3,
    borderColor: '#001a72',
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
  },
  animatedText: {
    color: '#ffffff',
    fontSize: 20,
  },
  animatedBox: {
    padding: 5,
    alignItems: 'center',
  },
});
