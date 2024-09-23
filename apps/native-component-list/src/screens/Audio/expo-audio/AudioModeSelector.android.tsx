import { AudioMode, setAudioModeAsync, InterruptionMode } from 'expo-audio';
import React from 'react';
import { PixelRatio, Switch, Text, View } from 'react-native';

import Button from '../../../components/Button';

interface State {
  modeToSet: Partial<AudioMode>;
  setMode: Partial<AudioMode>;
}

export default class AudioModeSelector extends React.Component<object, State> {
  readonly state: State = {
    modeToSet: {
      interruptionMode: 'duckOthers',
      shouldRouteThroughEarpiece: false,
      shouldPlayInBackground: false,
    },
    setMode: {
      interruptionMode: 'duckOthers',
      shouldRouteThroughEarpiece: false,
      shouldPlayInBackground: false,
    },
  };

  _applyMode = async () => {
    try {
      await setAudioModeAsync({ ...this.state.modeToSet });
      const { modeToSet } = this.state;
      this.setState({ setMode: modeToSet });
    } catch (error) {
      alert(error.message);
    }
  };

  _modesEqual = (modeA: Partial<AudioMode>, modeB: Partial<AudioMode>) =>
    modeA.interruptionMode === modeB.interruptionMode &&
    modeA.shouldRouteThroughEarpiece === modeB.shouldRouteThroughEarpiece &&
    modeA.shouldPlayInBackground === modeB.shouldPlayInBackground;

  _setMode = (interruptionModeAndroid: InterruptionMode) => () =>
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

  render() {
    return (
      <View style={{ marginTop: 5 }}>
        {this._renderToggle({
          title: 'Play through earpiece',
          valueName: 'shouldRouteThroughEarpiece',
        })}
        {this._renderToggle({
          title: 'Stay active in background',
          valueName: 'shouldPlayInBackground',
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
