import { BlurView } from 'expo';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

export default class App extends React.Component {
  render() {
    return (
      <View style={{ flex: 1 }}>
        {[25, 100].map(intensity => {
          return ['light', 'dark', 'default'].map(tintColor => (
            <View
              key={`${intensity}-${tintColor}`}
              accessibilityLabel={'target-' + `${tintColor}-${intensity}`}
              style={{ width: 200, height: 200 }}>
              <Image style={StyleSheet.absoluteFill} source={require('../assets/icons/app.png')} />
              <BlurView intensity={intensity} tint={tintColor} style={StyleSheet.absoluteFill} />
            </View>
          ));
        })}
      </View>
    );
  }
}
