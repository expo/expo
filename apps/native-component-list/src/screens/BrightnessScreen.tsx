import React from 'react';
import { ScrollView, Text, View, Slider } from 'react-native';
import * as Brightness from 'expo-brightness';
import * as Permissions from 'expo-permissions';
import HeadingText from '../components/HeadingText';
import Button from '../components/Button';

interface State {
  brightnessSlider: number;
  systemBrightnessSlider: number;
}

const brightnessTypes: string[] = ['Brightness', 'SystemBrightness'];

export default class BrightnessScreen extends React.Component<{}, State> {
  static navigationOptions = {
    title: 'Brightness',
  };

  readonly state: State = {
    brightnessSlider: -1,
    systemBrightnessSlider: -1,
  };

  componentDidMount() {
    Brightness.getBrightnessAsync().then(value => {
      this.setState({ brightnessSlider: value });
    });

    Brightness.getSystemBrightnessAsync().then(value => {
      this.setState({ systemBrightnessSlider: value });
    });
  }

  render() {
    let views = brightnessTypes.map(type => {
      let sliderValue = this.state.brightnessSlider;
      if (type === 'SystemBrightness') {
        sliderValue = this.state.systemBrightnessSlider;
      }
      return (
        <View style={{ padding: 20 }}>
          <HeadingText>{type}</HeadingText>
          {type === 'SystemBrightness' && (
            <Button
              title="Permissions.SYSTEM_BRIGHTNESS"
              onPress={() => {
                Permissions.askAsync(Permissions.SYSTEM_BRIGHTNESS).then(result => {
                  alert(JSON.stringify(result, null, 2));
                });
              }}
              style={{ marginTop: 15 }}
            />
          )}
          <Button
            title={'get' + type + 'Async'}
            onPress={() => {
              Brightness.getBrightnessAsync().then(value => {
                alert(value);
              });
            }}
            style={{ marginTop: 15, marginBottom: 20 }}
          />
          <Text style={{ marginBottom: -2 }}>
            {'set' + type + 'Async: '}
            {sliderValue && +sliderValue.toFixed(3)}
          </Text>
          <Slider
            {...this.props}
            value={sliderValue}
            onValueChange={value => {
              if (type === 'Brightness') {
                this.setState({ brightnessSlider: value });
                Brightness.setBrightnessAsync(value);
              } else {
                this.setState({ systemBrightnessSlider: value });
                Brightness.setSystemBrightnessAsync(value);
              }
            }}
          />
        </View>
      );
    });
    return <ScrollView style={{ flex: 1 }}>{views}</ScrollView>;
  }
}
