import { setAudioModeAsync, AudioMode } from 'expo-audio';
import React from 'react';
import { PixelRatio, Switch, Text, View } from 'react-native';

import Button from '../../../components/Button';
import ListButton from '../../../components/ListButton';

export default function AudioModeSelector() {
  const [state, setState] = React.useState<{ next: AudioMode; current: AudioMode }>({
    next: {
      interruptionMode: 'mixWithOthers',
      playsInSilentMode: false,
      allowsRecording: false,
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
    },
    current: {
      interruptionMode: 'mixWithOthers',
      playsInSilentMode: false,
      allowsRecording: false,
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
    },
  });

  const applyMode = async () => {
    try {
      await setAudioModeAsync(state.next);
      setState((state) => ({ ...state, current: state.next }));
    } catch (error) {
      alert(error.message);
    }
  };

  const modesEqual = (modeA: Partial<AudioMode>, modeB: Partial<AudioMode>) =>
    modeA.interruptionMode === modeB.interruptionMode &&
    modeA.playsInSilentMode === modeB.playsInSilentMode &&
    modeA.allowsRecording === modeB.allowsRecording &&
    modeA.shouldPlayInBackground === modeB.shouldPlayInBackground;

  const setMode = (interruptionMode: AudioMode['interruptionMode']) => () =>
    setState((state) => ({ ...state, next: { ...state.next, interruptionMode } }));

  const renderToggle = ({
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
        value={value !== undefined ? value : Boolean(state.next[valueName])}
        onValueChange={() =>
          setState((state) => ({
            ...state,
            next: { ...state.next, [valueName]: !state.next[valueName] },
          }))
        }
      />
    </View>
  );

  const renderModeSelector = ({
    title,
    disabled,
    value,
  }: {
    title: string;
    disabled?: boolean;
    value: AudioMode['interruptionMode'];
  }) => (
    <ListButton
      disabled={disabled}
      title={`${state.next.interruptionMode === value ? '✓ ' : ''}${title}`}
      onPress={setMode(value)}
    />
  );

  return (
    <View style={{ marginTop: 5 }}>
      {renderToggle({
        title: 'Plays in silent mode',
        valueName: 'playsInSilentMode',
      })}
      {renderToggle({
        title: 'Allows recording',
        valueName: 'allowsRecording',
        disabled: !state.next.playsInSilentMode,
        value: !state.next.playsInSilentMode ? false : undefined,
      })}
      {renderToggle({
        title: 'Stay active in background',
        valueName: 'shouldPlayInBackground',
        disabled: !state.next.playsInSilentMode,
        value: !state.next.playsInSilentMode ? false : undefined,
      })}
      {renderModeSelector({
        title: 'Mix with others',
        value: 'mixWithOthers',
      })}
      {renderModeSelector({
        title: 'Do not mix',
        value: 'doNotMix',
      })}
      {renderModeSelector({
        disabled: state.next.playsInSilentMode === false,
        title: 'Duck others',
        value: 'duckOthers',
      })}
      <Button
        title="Apply changes"
        onPress={applyMode}
        style={{ marginTop: 10 }}
        disabled={modesEqual(state.next, state.current)}
      />
    </View>
  );
}
