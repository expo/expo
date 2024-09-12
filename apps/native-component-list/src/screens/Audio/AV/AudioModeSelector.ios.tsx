import { Audio, AudioMode, InterruptionModeIOS } from 'expo-av';
import React from 'react';
import { PixelRatio, Switch, Text, View } from 'react-native';

import Button from '../../../components/Button';
import ListButton from '../../../components/ListButton';

interface State {
  modeToSet: Partial<AudioMode>;
  setMode: Partial<AudioMode>;
}

export default class AudioModeSelector extends React.Component<object, State> {
  readonly state: State = {
    modeToSet: {
      interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
      playsInSilentModeIOS: false,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
    },
    setMode: {
      interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
      playsInSilentModeIOS: false,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
    },
  };

  _applyMode = async () => {
    try {
      await Audio.setAudioModeAsync({ ...this.state.modeToSet });
      const { modeToSet } = this.state;
      this.setState({ setMode: modeToSet });
    } catch (error) {
      alert(error.message);
    }
  };

  _modesEqual = (modeA: Partial<AudioMode>, modeB: Partial<AudioMode>) =>
    modeA.interruptionModeIOS === modeB.interruptionModeIOS &&
    modeA.playsInSilentModeIOS === modeB.playsInSilentModeIOS &&
    modeA.allowsRecordingIOS === modeB.allowsRecordingIOS &&
    modeA.staysActiveInBackground === modeB.staysActiveInBackground;

  _setMode = (interruptionModeIOS: number) => () =>
    this.setState((state) => ({ modeToSet: { ...state.modeToSet, interruptionModeIOS } }));

  _renderToggle = ({
    title,
    disabled,
    valueName,
    value,
  }: {
    title: string;
    disabled?: boolean;
    valueName: keyof AudioMode;
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
          this.setState((state) => ({
            modeToSet: { ...state.modeToSet, [valueName]: !state.modeToSet[valueName] },
          }))
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
      title={`${this.state.modeToSet.interruptionModeIOS === value ? '✓ ' : ''}${title}`}
      onPress={this._setMode(value)}
    />
  );

  render() {
    return (
      <View style={{ marginTop: 5 }}>
        {this._renderToggle({
          title: 'Plays in silent mode',
          valueName: 'playsInSilentModeIOS',
        })}
        {this._renderToggle({
          title: 'Allows recording',
          valueName: 'allowsRecordingIOS',
          disabled: !this.state.modeToSet.playsInSilentModeIOS,
          value: !this.state.modeToSet.playsInSilentModeIOS ? false : undefined,
        })}
        {this._renderToggle({
          title: 'Stay active in background',
          valueName: 'staysActiveInBackground',
          disabled: !this.state.modeToSet.playsInSilentModeIOS,
          value: !this.state.modeToSet.playsInSilentModeIOS ? false : undefined,
        })}
        {this._renderModeSelector({
          title: 'Mix with others',
          value: InterruptionModeIOS.MixWithOthers,
        })}
        {this._renderModeSelector({
          title: 'Do not mix',
          value: InterruptionModeIOS.DoNotMix,
        })}
        {this._renderModeSelector({
          disabled: this.state.modeToSet.playsInSilentModeIOS === false,
          title: 'Duck others',
          value: InterruptionModeIOS.DuckOthers,
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
