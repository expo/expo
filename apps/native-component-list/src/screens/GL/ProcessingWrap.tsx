import { ProcessingView } from 'expo-processing';
import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';

import { Colors } from '../../constants';

/**
 * Given a `title` and a processing.js `sketch` function, return a component displaying that Processing sketch.
 * @param title string
 * @param sketch processing.js `sketch` function
 */
export default <P extends { style?: StyleProp<ViewStyle> } = object>(
  title: string,
  sketch: (p: any) => void
) => {
  const wrapped = (props: P) => (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: Colors.tintColor,
        },
        props.style,
      ]}>
      <ProcessingView style={{ flex: 1 }} sketch={sketch} />
    </View>
  );
  wrapped.title = title;
  return wrapped;
};
