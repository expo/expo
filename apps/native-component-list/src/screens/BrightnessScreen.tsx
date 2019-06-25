import React from 'react';
import { ScrollView, Text, View, Slider } from 'react-native';
import * as Brightness from 'expo-brightness';
import * as Permissions from 'expo-permissions';
import HeadingText from '../components/HeadingText';
import Button from '../components/Button';

interface State {
  initBrightness: { [type: string]: number };
  sliderBrightness: { [type: string]: number };
}

const brightnessTypes: string[] = ['Brightness', 'SystemBrightness'];

export default class BrightnessScreen extends React.Component<{}, State> {
  static navigationOptions = {
    title: 'Brightness',
  };

  readonly state: State = {
    initBrightness: {},
    sliderBrightness: {},
  };

  componentDidMount() {
    Brightness.getBrightnessAsync().then(value => {
      this.setState({ initBrightness: { ...this.state.initBrightness, Brightness: value } });
    });

    Brightness.getSystemBrightnessAsync().then(value => {
      this.setState({ initBrightness: { ...this.state.initBrightness, SystemBrightness: value } });
    });
  }

  render() {
    let views = brightnessTypes.map(type => {
      return (
        <View key={type} style={{ padding: 20 }}>
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
            {(this.state.sliderBrightness[type] || this.state.initBrightness[type] || 0).toFixed(3)}
          </Text>
          <Slider
            {...this.props}
            value={this.state.initBrightness[type] || 0}
            onValueChange={value => {
              this.setState({
                sliderBrightness: { ...this.state.sliderBrightness, [type]: value },
              });
              if (type === 'Brightness') {
                Brightness.setBrightnessAsync(value);
              } else {
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
