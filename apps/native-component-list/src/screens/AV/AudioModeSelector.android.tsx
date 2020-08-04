import { Audio } from 'expo-av';
import React from 'react';
import { PixelRatio, Switch, Text, View } from 'react-native';

import Button from '../../components/Button';
import ListButton from '../../components/ListButton';

interface Mode {
  interruptionModeAndroid: number;
  shouldDuckAndroid: boolean;
  playThroughEarpieceAndroid: boolean;
  staysActiveInBackground: boolean;
}

interface State {
  modeToSet: Mode;
  setMode: Mode;
}

export default class AudioModeSelector extends React.Component<{}, State> {
  readonly state: State = {
    modeToSet: {
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    },
    setMode: {
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    },
  };

  _applyMode = async () => {
    try {
      await Audio.setAudioModeAsync({
        ...this.state.modeToSet,
        // iOS values don't matter, this is Android-only selector
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      });
      this.setState({ setMode: this.state.modeToSet });
    } catch (error) {
      alert(error.message);
    }
  };

  _modesEqual = (modeA: Mode, modeB: Mode) =>
    modeA.interruptionModeAndroid === modeB.interruptionModeAndroid &&
    modeA.playThroughEarpieceAndroid === modeB.playThroughEarpieceAndroid &&
    modeA.shouldDuckAndroid === modeB.shouldDuckAndroid &&
    modeA.staysActiveInBackground === modeB.staysActiveInBackground;

  _setMode = (interruptionModeAndroid: number) => () =>
    this.setState({ modeToSet: { ...this.state.modeToSet, interruptionModeAndroid } });

  _renderToggle = ({
    title,
    disabled,
    valueName,
    value,
  }: {
    title: string;
    disabled?: boolean;
    valueName:
      | 'interruptionModeAndroid'
      | 'shouldDuckAndroid'
      | 'playThroughEarpieceAndroid'
      | 'staysActiveInBackground';
    value?: boolean;
  }) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 5,
        borderBottomWidth: 1.0 / PixelRatio.get(),
        borderBottomColor: '#cccccc',
      }}>
      <Text style={{ flex: 1, fontSize: 16 }}>{title}</Text>
      <Switch
        disabled={disabled}
        value={value !== undefined ? value : Boolean(this.state.modeToSet[valueName])}
        onValueChange={() =>
          this.setState({
            modeToSet: { ...this.state.modeToSet, [valueName]: !this.state.modeToSet[valueName] },
          })
        }
      />
    </View>
  );

  _renderModeSelector = ({
    title,
    disabled,
    value,
  }: {
    title: string;
    disabled?: boolean;
    value: number;
  }) => (
    <ListButton
      disabled={disabled}
      title={`${this.state.modeToSet.interruptionModeAndroid === value ? '✓ ' : ''}${title}`}
      onPress={this._setMode(value)}
    />
  );

  render() {
    return (
      <View style={{ marginTop: 5 }}>
        {this._renderToggle({
          title: 'Should be ducked',
          valueName: 'shouldDuckAndroid',
        })}
        {this._renderToggle({
          title: 'Play through earpiece',
          valueName: 'playThroughEarpieceAndroid',
        })}
        {this._renderToggle({
          title: 'Stay active in background',
          valueName: 'staysActiveInBackground',
        })}
        {this._renderModeSelector({
          title: 'Do not mix',
          value: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        })}
        {this._renderModeSelector({
          title: 'Duck others',
          value: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
        })}
        <Button
          title="Apply changes"
          onPress={this._applyMode}
          style={{ marginTop: 10 }}
          disabled={this._modesEqual(this.state.modeToSet, this.state.setMode)}
        />
      </View>
    );
  }
}
