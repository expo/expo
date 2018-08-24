import React from 'react';
import { ScrollView, View } from 'react-native';
import { KeepAwake } from 'expo';
import Button from '../components/Button';

export default class KeepAwakeScreen extends React.Component {
  static navigationOptions = {
    title: 'KeepAwake',
  };

  _activate = () => {
    KeepAwake.activate();
  };

  _deactivate = () => {
    KeepAwake.deactivate();
  };

  render() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Button style={{ marginBottom: 10 }} onPress={this._activate} title="Activate" />
        <Button onPress={this._deactivate} title="Deactivate" />
      </View>
    );
  }
}
