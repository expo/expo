import Ionicons from '@expo/vector-icons/build/Ionicons';
import {
  useAudioRecorder,
  useAudioRecorderState,
  AudioModule,
  RecordingStatus,
  RecordingOptions,
  RecordingPresets,
} from 'expo-audio';
import React, { useEffect } from 'react';
import {
  Alert,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import AudioInputSelector from './AudioInputSelector';
import Button from '../../../components/Button';
import Colors from '../../../constants/Colors';

type RecorderProps = {
  onDone?: (uri: string) => void;
  style?: StyleProp<ViewStyle>;
};

export default function Recorder({ onDone, style }: RecorderProps) {
  const [state, setState] = React.useState<RecordingStatus>({
    id: 0,
    hasError: false,
    error: null,
    isFinished: false,
    url: null,
  });
  const [recorderOptions, setRecorderOptions] = React.useState<RecordingOptions>(
    RecordingPresets.HIGH_QUALITY
  );

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permission to access microphone was denied');
      }
    })();
  }, []);

  const audioRecorder = useAudioRecorder(recorderOptions, (status) => {
    setState(status);
  });

  const recorderState = useAudioRecorderState(audioRecorder);

  const record = () => audioRecorder.record();

  const renderOptionsButton = (title: string, options: RecordingOptions) => (
    <Button
      onPress={() => setRecorderOptions(options)}
      title={`${recorderOptions === options ? '✓ ' : ''}${title}`}
    />
  );

  const togglePause = () => {
    if (audioRecorder.isRecording) {
      audioRecorder.pause();
    } else {
      audioRecorder.record();
    }
  };

  const stop = async () => {
    if (onDone) {
      await audioRecorder.stop();
      onDone(audioRecorder.uri!);
    }
    setState((state) => ({ ...state, options: undefined, durationMillis: 0 }));
  };

  const maybeRenderErrorOverlay = () => {
    if (state.error) {
      return (
        <ScrollView style={styles.errorMessage}>
          <Text style={styles.errorText}>{state.error}</Text>
        </ScrollView>
      );
    }
    return null;
  };

  const renderRecorderButtons = () => {
    if (!recorderState.isRecording && recorderState.durationMillis === 0) {
      return (
        <TouchableOpacity
          onPress={record}
          disabled={!recorderState.canRecord}
          style={[
            styles.bigRoundButton,
            { backgroundColor: 'gray' },
            recorderState.canRecord && { backgroundColor: 'red' },
          ]}>
          <Ionicons name="mic" style={[styles.bigIcon, { color: 'white' }]} />
        </TouchableOpacity>
      );
    }

    return (
      <View>
        <TouchableOpacity
          onPress={togglePause}
          style={[styles.bigRoundButton, { borderColor: 'red', borderWidth: 5 }]}>
          <Ionicons
            name={`${recorderState.isRecording ? 'pause' : 'mic'}` as any}
            style={[styles.bigIcon, { color: 'red' }]}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={stop}
          style={[
            styles.smallRoundButton,
            {
              backgroundColor: 'red',
              position: 'absolute',
              bottom: -5,
              right: -5,
              borderColor: 'white',
              borderWidth: 4,
            },
          ]}>
          <Ionicons name="square" style={[styles.smallIcon, { color: 'white' }]} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={style}>
      <View style={styles.container}>
        {renderOptionsButton('High Quality', RecordingPresets.HIGH_QUALITY)}
        <Button
          onPress={() => audioRecorder.prepareToRecordAsync(recorderOptions)}
          disabled={recorderState.canRecord}
          title="Prepare Recording"
          style={[!recorderState.canRecord && { backgroundColor: 'gray' }]}
        />
        {renderOptionsButton('Low Quality', RecordingPresets.LOW_QUALITY)}
      </View>
      <View style={styles.centerer}>
        {renderRecorderButtons()}
        <Text style={{ fontWeight: 'bold', marginVertical: 10 }}>
          {_formatTime(recorderState.durationMillis / 1000)}
        </Text>
      </View>
      <AudioInputSelector recorder={audioRecorder} />
      {maybeRenderErrorOverlay()}
    </View>
  );
}

const _formatTime = (duration: number) => {
  const paddedSecs = _leftPad(`${Math.floor(duration % 60)}`, '0', 2);
  const paddedMins = _leftPad(`${Math.floor(duration / 60)}`, '0', 2);
  if (duration > 3600) {
    return `${Math.floor(duration / 3600)}:${paddedMins}:${paddedSecs}`;
  }
  return `${paddedMins}:${paddedSecs}`;
};

const _leftPad = (s: string, padWith: string, expectedMinimumSize: number): string => {
  if (s.length >= expectedMinimumSize) {
    return s;
  }
  return _leftPad(`${padWith}${s}`, padWith, expectedMinimumSize);
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    marginVertical: 10,
  },
  centerer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    padding: 8,
    fontSize: 24,
    color: Colors.tintColor,
  },
  errorMessage: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.errorBackground,
  },
  errorText: {
    margin: 8,
    fontWeight: 'bold',
    color: Colors.errorText,
  },
  bigRoundButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bigIcon: {
    fontSize: 50,
  },
  smallRoundButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallIcon: {
    fontSize: 24,
  },
});
