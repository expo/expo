import { Audio } from 'expo-av';
import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { BorderlessButton } from 'react-native-gesture-handler';

import AudioPlayer from '../components/AudioPlayer';
import Colors from '../constants/Colors';
import Environment from '../utils/Environment';
import { useAudio, useAudioMode } from '../utils/useAudio';

const initialAudioMode = {
  interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS,
  playsInSilentModeIOS: false,
  allowsRecordingIOS: false,
  staysActiveInBackground: false,
};

export default function AudioDiagnosticsScreen() {
  const [isAudioEnabled, setAudioEnabled] = useAudio();
  const [audioMode, setAudioMode] = useAudioMode(initialAudioMode);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Audio Player</Text>
      <AudioPlayer
        isAudioEnabled={isAudioEnabled}
        source={{
          uri:
            'https://p.scdn.co/mp3-preview/f7a8ab9c5768009b65a30e9162555e8f21046f46?cid=162b7dc01f3a4a2ca32ed3cec83d1e02',
        }}
      />
      <Text style={[styles.title, { marginTop: 16 }]}>Audio Modes</Text>
      <AudioOptionSwitch
        title="Enable Audio"
        value={isAudioEnabled}
        onValueChange={value => {
          setAudioEnabled(value);
        }}
      />
      <AudioOptionSwitch
        title="Play in Silent Mode"
        value={audioMode.playsInSilentModeIOS}
        disabled={!isAudioEnabled}
        onValueChange={value => {
          const newAudioMode = {
            ...audioMode,
            playsInSilentModeIOS: value,
            staysActiveInBackground: audioMode.staysActiveInBackground && value,
          };
          setAudioMode(newAudioMode);
        }}
      />
      <AudioOptionSwitch
        title="Allow Recording"
        value={audioMode.allowsRecordingIOS}
        disabled={!isAudioEnabled || !audioMode.playsInSilentModeIOS}
        onValueChange={value => {
          const newAudioMode = { ...audioMode, allowsRecordingIOS: value };
          setAudioMode(newAudioMode);
        }}
      />
      {!Environment.IsIOSRestrictedBuild ? (
        <AudioOptionSwitch
          title="Continues Playing in Background"
          value={audioMode.staysActiveInBackground}
          disabled={!isAudioEnabled || !audioMode.playsInSilentModeIOS}
          onValueChange={value => {
            const newAudioMode = { ...audioMode, staysActiveInBackground: value };
            setAudioMode(newAudioMode);
          }}
        />
      ) : null}
      <AudioOptionSelector
        title="Interruption Mode"
        items={[
          { name: 'Mix with Other Apps', value: Audio.INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS },
          { name: 'Do Not Mix', value: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX },
          {
            name: 'Duck Other Apps',
            value: Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS,
            disabled: !audioMode.playsInSilentModeIOS,
          },
        ]}
        disabled={!isAudioEnabled}
        selectedValue={audioMode.interruptionModeIOS}
        onSelect={value => {
          const newAudioMode = { ...audioMode, interruptionModeIOS: value };
          setAudioMode(newAudioMode);
        }}
      />
    </ScrollView>
  );
}

AudioDiagnosticsScreen.navigationOptions = {
  title: 'Audio Diagnostics',
};

type AudioOptionSwitchProps = {
  title: string;
  disabled?: boolean;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

function AudioOptionSwitch(props: AudioOptionSwitchProps) {
  return (
    <View style={styles.switch}>
      <Text style={styles.optionTitle}>{props.title}</Text>
      <Switch disabled={props.disabled} value={props.value} onValueChange={props.onValueChange} />
    </View>
  );
}

type AudioOptionSelectorProps<T> = {
  title: string;
  disabled?: boolean;
  items: { name: string; value: T; disabled?: boolean }[];
  selectedValue: T;
  onSelect: (value: T) => void;
};

function AudioOptionSelector<T>(props: AudioOptionSelectorProps<T>) {
  return (
    <>
      <Text style={styles.selectorTitle}>{props.title}</Text>
      {props.items.map(item => (
        <BorderlessButton
          key={item.name}
          enabled={!props.disabled && !item.disabled}
          onPress={() => props.onSelect(item.value)}
          style={styles.selectorButton}>
          <Text
            style={[
              styles.selectorButtonText,
              props.disabled || item.disabled ? styles.disabledSelectorButtonText : null,
            ]}>
            {item.name}
            {Object.is(item.value, props.selectedValue) ? ' ✓' : null}
          </Text>
        </BorderlessButton>
      ))}
      <View
        style={{
          borderBottomColor: Colors.navBarBorderBottom,
          borderBottomWidth: StyleSheet.hairlineWidth,
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.greyBackground,
    flexGrow: 1,
  },
  contentContainer: {
    paddingVertical: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
  switch: {
    alignItems: 'center',
    borderBottomColor: Colors.navBarBorderBottom,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  optionTitle: {
    flex: 1,
    fontSize: 16,
  },
  selectorTitle: {
    fontSize: 16,
    paddingBottom: 5,
    paddingHorizontal: 8,
    paddingTop: 10,
  },
  selectorButton: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  selectorButtonText: {
    color: Colors.tintColor,
    fontSize: 16,
    padding: 5,
  },
  disabledSelectorButtonText: {
    color: Colors.greyText,
  },
});
