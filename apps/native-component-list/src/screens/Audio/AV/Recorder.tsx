import Ionicons from '@expo/vector-icons/Ionicons';
import { Audio } from 'expo-av';
import React from 'react';
import {
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

interface State {
  options?: Audio.RecordingOptions;
  canRecord: boolean;
  durationMillis: number;
  isRecording: boolean;
  errorMessage?: string;
}

export default class Recorder extends React.Component<
  { onDone: (uri: string) => void; style?: StyleProp<ViewStyle> },
  State
> {
  readonly state: State = {
    canRecord: false,
    durationMillis: 0,
    isRecording: false,
  };

  _recorder?: Audio.Recording;

  componentWillUnmount() {
    if (this._recorder) {
      this._recorder.stopAndUnloadAsync();
    }
  }

  _prepare = (options: Audio.RecordingOptions) => async () => {
    const recordingObject = new Audio.Recording();
    try {
      await Audio.requestPermissionsAsync();
      await recordingObject.prepareToRecordAsync(options);
      recordingObject.setOnRecordingStatusUpdate(this._updateStateToStatus);
      const status = await recordingObject.getStatusAsync();
      this.setState({ ...status, options });
      this._recorder = recordingObject;
    } catch (error) {
      this.setState({ errorMessage: error.message });
    }
  };

  _updateStateToStatus = (status: Audio.RecordingStatus) => this.setState(status);

  _record = () => this._recorder!.startAsync();

  _togglePause = () => {
    if (this.state.isRecording) {
      this._recorder!.pauseAsync();
    } else {
      this._recorder!.startAsync();
    }
  };

  _stopAndUnload = async () => {
    await this._recorder!.stopAndUnloadAsync();
    if (this.props.onDone) {
      this.props.onDone(this._recorder!.getURI()!);
    }
    this._recorder = undefined;
    this.setState({ options: undefined, durationMillis: 0 });
  };

  _maybeRenderErrorOverlay = () => {
    if (this.state.errorMessage) {
      return (
        <ScrollView style={styles.errorMessage}>
          <Text style={styles.errorText}>{this.state.errorMessage}</Text>
        </ScrollView>
      );
    }
    return null;
  };

  _renderPrepareButton = (title: string, options: Audio.RecordingOptions) => (
    <Button
      disabled={!!this.state.options}
      onPress={this._prepare(options)}
      title={`${this.state.options === options ? '✓ ' : ''}${title}`}
    />
  );

  _renderRecorderButtons = () => {
    if (!this.state.isRecording && this.state.durationMillis === 0) {
      return (
        <TouchableOpacity
          onPress={this._record}
          disabled={!this.state.canRecord}
          style={[
            styles.bigRoundButton,
            { backgroundColor: 'gray' },
            this.state.canRecord && { backgroundColor: 'red' },
          ]}>
          <Ionicons name="mic" style={[styles.bigIcon, { color: 'white' }]} />
        </TouchableOpacity>
      );
    }

    return (
      <View>
        <TouchableOpacity
          onPress={this._togglePause}
          style={[styles.bigRoundButton, { borderColor: 'red', borderWidth: 5 }]}>
          <Ionicons
            name={`${this.state.isRecording ? 'pause' : 'mic'}` as any}
            style={[styles.bigIcon, { color: 'red' }]}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={this._stopAndUnload}
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

  render() {
    return (
      <View style={this.props.style}>
        <View style={styles.container}>
          {this._renderPrepareButton('High quality', Audio.RecordingOptionsPresets.HIGH_QUALITY)}
          {this._renderPrepareButton('Low quality', Audio.RecordingOptionsPresets.LOW_QUALITY)}
        </View>
        <View style={styles.centerer}>
          {this._renderRecorderButtons()}
          <Text style={{ fontWeight: 'bold', marginVertical: 10 }}>
            {_formatTime(this.state.durationMillis / 1000)}
          </Text>
        </View>
        <AudioInputSelector recordingObject={this._recorder} />
        {this._maybeRenderErrorOverlay()}
      </View>
    );
  }
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
