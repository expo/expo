import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { TextInput } from 'react-native';
import { dispatchCommand } from 'react-native-reanimated';
import { setNativeProps } from 'react-native-reanimated';

import Animated, { useAnimatedRef, useHandler } from 'react-native-reanimated';

import { useEvent } from 'react-native-reanimated';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

SplashScreen.hide();

export default function App() {
  const animatedRef = useAnimatedRef();

  const handlers = {
    onChange: (event: any) => {
      'worklet';
      console.log('event', event);
    },
  };
  const { context, doDependenciesDiffer } = useHandler(handlers);

  const textInputHandler = useEvent(
    (event: any) => {
      'worklet';
      const { onChange } = handlers;
      if (onChange) {
        console.log('event', event);
        // Remove all non-digit characters
        const digitsOnly = event.text.replace(/\D/g, '');

        // Limit to 10 digits for US phone number
        const limitedDigits = digitsOnly.slice(0, 10);

        // Format as (XXX) XXX-XXXX
        let formattedText = limitedDigits;
        if (limitedDigits.length >= 6) {
          formattedText = `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`;
        } else if (limitedDigits.length >= 3) {
          formattedText = `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3)}`;
        } else if (limitedDigits.length > 0) {
          formattedText = `(${limitedDigits}`;
        }

        // Update the text input if formatting was applied
        if (formattedText !== event.text) {
          dispatchCommand(animatedRef, 'setTextAndSelection', [
            event.eventCount,
            formattedText,
            -1,
            -1,
          ]);
        }
        onChange(event);
      }
    },
    ['onChange'],
    doDependenciesDiffer
  );

  return (
    <AnimatedTextInput
      style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginTop: 100 }}
      onChange={textInputHandler}
      ref={animatedRef}
    />
  );
}
