import * as KeepAwake from 'expo-keep-awake';
import React from 'react';
import { View } from 'react-native';

import Button from '../components/Button';

export default class KeepAwakeScreen extends React.Component {
  static navigationOptions = {
    title: 'KeepAwake',
  };

  _activate = () => {
    KeepAwake.activateKeepAwakeAsync();
  };

  _deactivate = () => {
    KeepAwake.deactivateKeepAwake();
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
