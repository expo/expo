import Slider from '@react-native-community/slider';
import * as Brightness from 'expo-brightness';
import * as Permissions from 'expo-permissions';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import Button from '../components/Button';
import HeadingText from '../components/HeadingText';

interface State {
  initBrightness: { [type: string]: number };
  sliderBrightness: { [type: string]: number };
  systemBrightnessPermissionGranted: boolean;
}

const brightnessTypes: string[] = ['Brightness', 'SystemBrightness'];

export default class BrightnessScreen extends React.Component<{}, State> {
  static navigationOptions = {
    title: 'Brightness',
  };

  readonly state: State = {
    initBrightness: {},
    sliderBrightness: {},
    systemBrightnessPermissionGranted: false,
  };

  componentDidMount() {
    Brightness.getBrightnessAsync().then(value => {
      this.setState({ initBrightness: { ...this.state.initBrightness, Brightness: value } });
    });

    Brightness.getSystemBrightnessAsync().then(value => {
      this.setState({ initBrightness: { ...this.state.initBrightness, SystemBrightness: value } });
    });

    Permissions.getAsync(Permissions.SYSTEM_BRIGHTNESS).then(result => {
      if (result.status === 'granted') {
        this.setState({ systemBrightnessPermissionGranted: true });
      }
    });
  }

  askSystemBrightnessPermissionAsync() {
    Permissions.askAsync(Permissions.SYSTEM_BRIGHTNESS).then(result => {
      if (result.status === 'granted') {
        this.setState({ systemBrightnessPermissionGranted: true });
      }
      alert(JSON.stringify(result, null, 2));
    });
  }

  alertBrightnessAsync(type: string) {
    (type === 'Brightness'
      ? Brightness.getBrightnessAsync()
      : Brightness.getSystemBrightnessAsync()
    ).then(value => {
      alert(value);
    });
  }

  updateBrightnessAsync(value: number, type: string) {
    this.setState({
      sliderBrightness: { ...this.state.sliderBrightness, [type]: value },
    });
    if (type === 'Brightness') {
      Brightness.setBrightnessAsync(value);
    } else {
      Brightness.setSystemBrightnessAsync(value);
    }
  }

  render() {
    let views = brightnessTypes.map(type => {
      return (
        <View key={type} style={{ padding: 20 }}>
          <HeadingText>{type}</HeadingText>
          {type === 'SystemBrightness' && (
            <Button
              title="Permissions.SYSTEM_BRIGHTNESS"
              onPress={() => this.askSystemBrightnessPermissionAsync()}
              style={{ marginTop: 15 }}
            />
          )}
          <Button
            title={'get' + type + 'Async'}
            onPress={() => this.alertBrightnessAsync(type)}
            style={{ marginTop: 15, marginBottom: 20 }}
          />
          <Text style={{ marginBottom: -2 }}>
            {'set' + type + 'Async: '}
            {(this.state.sliderBrightness[type] || this.state.initBrightness[type] || 0).toFixed(3)}
          </Text>
          <Slider
            {...this.props}
            value={this.state.initBrightness[type] || 0}
            disabled={type === 'SystemBrightness' && !this.state.systemBrightnessPermissionGranted}
            onValueChange={value => this.updateBrightnessAsync(value, type)}
          />
        </View>
      );
    });
    return <ScrollView style={{ flex: 1 }}>{views}</ScrollView>;
  }
}
