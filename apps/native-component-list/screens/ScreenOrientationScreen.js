import React from 'react';
import { ScrollView } from 'react-native';
import { ScreenOrientation } from 'expo';
import ListButton from '../components/ListButton';

export default class ScreenOrientationScreen extends React.Component {
  static navigationOptions = {
    title: 'ScreenOrientation',
  };

  allow = async orientation => {
    await ScreenOrientation.allowAsync(orientation).catch(console.warn); // on iPhoneX PortraitUpsideDown would be rejected
  };

  doesSupport = async () => {
    const result = await ScreenOrientation.doesSupportAsync(
      ScreenOrientation.Orientation.PORTRAIT_DOWN
    ).catch(console.warn);
    alert(`Orientation.PORTRAIT_DOWN supported: ${JSON.stringify(result)}`);
  };

  render() {
    return (
      <ScrollView style={{ padding: 10 }}>
        {Object.keys(ScreenOrientation.Orientation).map(orientation => (
          <ListButton
            key={orientation}
            onPress={() => this.allow(orientation)}
            title={orientation}
          />
        ))}
        <ListButton
          key="doesSupport"
          onPress={this.doesSupport}
          title="Check Orientation.PORTRAIT_DOWN support"
        />
      </ScrollView>
    );
  }
}
