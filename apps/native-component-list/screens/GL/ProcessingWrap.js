import React from 'react';
import { View } from 'react-native';
import { ProcessingView } from 'expo-processing';

import { Colors } from '../../constants';

// Given a `title` and a processing.js `sketch` function, return a component
// displaying that Processing sketch.

export default (title, sketch) => {
  const wrapped = props => (
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
