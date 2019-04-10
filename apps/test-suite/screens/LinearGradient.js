import { LinearGradient } from 'expo';
import React from 'react';
import { View } from 'react-native';

export default class App extends React.Component {
  render() {
    return (
      <View>
        <LinearGradient
          accessibilityLabel="target-000"
          colors={['red', 'orange', 'cyan']}
          locations={[0.1, 0.5, 0.8]}
          start={[0, 1]}
          end={[1, 0.2]}
          style={{ width: 300, height: 300 }}
        />
        <LinearGradient
          accessibilityLabel="target-001"
          colors={['yellow', 'rgba(0,0,0,0)']}
          style={{ width: 300, height: 300 }}
        />
      </View>
    );
  }
}
