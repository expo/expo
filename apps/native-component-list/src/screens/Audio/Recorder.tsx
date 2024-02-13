import Ionicons from '@expo/vector-icons/build/Ionicons';
import { AudioQuality, OutputFormat, useAudioRecorder, AudioModule } from 'expo-audio';
import { Audio } from 'expo-av';
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
import Button from '../../components/Button';
import Colors from '../../constants/Colors';

interface State {
  options?: Audio.RecordingOptions;
  canRecord: boolean;
  durationMillis: number;
  isRecording: boolean;
  errorMessage?: string;
}

type RecorderProps = {
  onDone?: (uri: string) => void;
  style?: StyleProp<ViewStyle>;
};

export default function Recorder({ onDone, style }: RecorderProps) {
  const [state, setState] = React.useState<State>({
    canRecord: false,
    durationMillis: 0,
    isRecording: false,
    errorMessage: '',
  });

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permission to access microphone was denied');
      }
    })();
  }, []);

  const audioRecorder = useAudioRecorder(
    {
      extension: '.caf',
      outputFormat: OutputFormat.MPEG4AAC,
      audioQuality: AudioQuality.MAX,
      sampleRate: 44100,
      numberOfChannels: 2,
      bitRate: 128000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
    (status) => {
      console.log(status);
    }
  );

  const prepare = (options: Audio.RecordingOptions) => async () => {
    try {
      await AudioModule.requestRecordingPermissionsAsync();
      const status = audioRecorder.getStatus();
      setState({ ...status, options });
    } catch (error) {
      setState((state) => ({ ...state, errorMessage: error.message }));
    }
  };

  const record = () => audioRecorder.record();

  const togglePause = () => {
    if (audioRecorder.isRecording) {
      audioRecorder.pause();
    } else {
      audioRecorder.record();
    }
  };

  const stopAndUnload = async () => {
    if (onDone) {
      onDone(audioRecorder.uri!);
    }
    setState((state) => ({ ...state, options: undefined, durationMillis: 0 }));
  };

  useEffect(() => {
    return () => audioRecorder.release();
  }, []);

  const maybeRenderErrorOverlay = () => {
    if (state.errorMessage) {
      return (
        <ScrollView style={styles.errorMessage}>
          <Text style={styles.errorText}>{state.errorMessage}</Text>
        </ScrollView>
      );
    }
    return null;
  };

  const renderPrepareButton = (title: string, options: Audio.RecordingOptions) => (
    <Button
      disabled={!!state.options}
      onPress={prepare(options)}
      title={`${state.options === options ? '✓ ' : ''}${title}`}
    />
  );

  const renderRecorderButtons = () => {
    if (!state.isRecording && state.durationMillis === 0) {
      return (
        <TouchableOpacity
          onPress={record}
          disabled={state.canRecord}
          style={[
            styles.bigRoundButton,
            { backgroundColor: 'gray' },
            state.canRecord && { backgroundColor: 'red' },
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
            name={`${state.isRecording ? 'pause' : 'mic'}` as any}
            style={[styles.bigIcon, { color: 'red' }]}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={stopAndUnload}
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
        {renderPrepareButton('High quality', Audio.RecordingOptionsPresets.HIGH_QUALITY)}
        {renderPrepareButton('Low quality', Audio.RecordingOptionsPresets.LOW_QUALITY)}
      </View>
      <View style={styles.centerer}>
        {renderRecorderButtons()}
        <Text style={{ fontWeight: 'bold', marginVertical: 10 }}>
          {_formatTime(state.durationMillis / 1000)}
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
