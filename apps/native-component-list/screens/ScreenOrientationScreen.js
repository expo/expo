import React from 'react';
import { Button, ScrollView, View } from 'react-native';
import { ScreenOrientation } from 'expo';
import ListButton from '../components/ListButton';

export default class ScreenOrientationScreen extends React.Component {
  static navigationOptions = {
    title: 'ScreenOrientation',
  };
  
  render() {
    return (
      <ScrollView style={{ padding: 10 }}>
        {Object.keys(ScreenOrientation.Orientation).map(orientation => (
          <ListButton
            key={orientation}
            onPress={() => {
              ScreenOrientation.allow(orientation);
            }}
            title={orientation}
          />
        ))}
      </ScrollView>
    );
  }
}
