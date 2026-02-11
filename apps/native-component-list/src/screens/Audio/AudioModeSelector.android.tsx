import { AudioMode, setAudioModeAsync } from 'expo-audio';
import React from 'react';
import { PixelRatio, Switch, Text, View } from 'react-native';

import Button from '../../components/Button';
import ListButton from '../../components/ListButton';

export default function AudioModeSelector() {
  const [state, setState] = React.useState<{
    next: Partial<AudioMode>;
    current: Partial<AudioMode>;
  }>({
    next: {
      interruptionMode: 'doNotMix',
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
      allowsBackgroundRecording: false,
    },
    current: {
      interruptionMode: 'doNotMix',
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
      allowsBackgroundRecording: false,
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
    modeA.shouldRouteThroughEarpiece === modeB.shouldRouteThroughEarpiece &&
    modeA.shouldPlayInBackground === modeB.shouldPlayInBackground &&
    modeA.allowsBackgroundRecording === modeB.allowsBackgroundRecording;

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
        title: 'Play through earpiece',
        valueName: 'shouldRouteThroughEarpiece',
      })}
      {renderToggle({
        title: 'Stay active in background',
        valueName: 'shouldPlayInBackground',
      })}
      {renderToggle({
        title: 'Allow background recording',
        valueName: 'allowsBackgroundRecording',
      })}
      {renderModeSelector({
        title: 'Do not mix',
        value: 'doNotMix',
      })}
      {renderModeSelector({
        title: 'Duck others',
        value: 'duckOthers',
      })}
      {renderModeSelector({
        title: 'Mix with others',
        value: 'mixWithOthers',
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
