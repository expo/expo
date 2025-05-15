import { AudioMode, setAudioModeAsync } from 'expo-audio';
import React from 'react';
import { PixelRatio, Switch, Text, View } from 'react-native';

import Button from '../../../components/Button';
import ListButton from '../../../components/ListButton';

export default function AudioModeSelector() {
  const [state, setState] = React.useState<{
    next: Partial<AudioMode>;
    current: Partial<AudioMode>;
  }>({
    next: {
      interruptionModeAndroid: 'doNotMix',
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
    },
    current: {
      interruptionModeAndroid: 'doNotMix',
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
    modeA.interruptionModeAndroid === modeB.interruptionModeAndroid &&
    modeA.shouldRouteThroughEarpiece === modeB.shouldRouteThroughEarpiece &&
    modeA.shouldPlayInBackground === modeB.shouldPlayInBackground;

  const setMode = (interruptionModeAndroid: AudioMode['interruptionModeAndroid']) => () =>
    setState((state) => ({ ...state, next: { ...state.next, interruptionModeAndroid } }));

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
    value: AudioMode['interruptionModeAndroid'];
  }) => (
    <ListButton
      disabled={disabled}
      title={`${state.next.interruptionModeAndroid === value ? '✓ ' : ''}${title}`}
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
      {renderModeSelector({
        title: 'Do not mix',
        value: 'doNotMix',
      })}
      {renderModeSelector({
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
