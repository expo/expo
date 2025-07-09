import { Audio, AudioMode, InterruptionModeAndroid } from 'expo-av';
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
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    },
    setMode: {
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
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
    modeA.interruptionModeAndroid === modeB.interruptionModeAndroid &&
    modeA.playThroughEarpieceAndroid === modeB.playThroughEarpieceAndroid &&
    modeA.shouldDuckAndroid === modeB.shouldDuckAndroid &&
    modeA.staysActiveInBackground === modeB.staysActiveInBackground;

  _setMode = (interruptionModeAndroid: number) => () =>
    this.setState((state) => ({ modeToSet: { ...state.modeToSet, interruptionModeAndroid } }));

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
          value: InterruptionModeAndroid.DoNotMix,
        })}
        {this._renderModeSelector({
          title: 'Duck others',
          value: InterruptionModeAndroid.DuckOthers,
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
