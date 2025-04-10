import { CameraView } from 'expo-camera';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useRef, useState } from 'react';
import { View, StyleSheet, Button, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function CameraScreenPauseRecording() {
  const camera = useRef<CameraView>(null);
  const player = useVideoPlayer(null);

  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [uri, setUri] = useState('');

  const recordAsync = async () => {
    if (recording) {
      camera.current?.stopRecording();
    }
    setRecording(true);
    const result = await camera.current?.recordAsync();
    setUri(result?.uri ?? '');
    player.replace({ uri: result?.uri });
    setRecording(false);
  };

  const toggleRecording = () => {
    camera.current?.toggleRecordingAsync();
    setPaused((p) => !p);
  };

  return (
    <View style={styles.screen}>
      {!uri ? (
        <CameraView
          ref={camera}
          style={StyleSheet.absoluteFillObject}
          facing="back"
          active
          mode="video"
          videoQuality="2160p"
          pictureSize="1920x1080"
        />
      ) : (
        <VideoView player={player} style={{ width, aspectRatio: 1 }} />
      )}
      <View style={styles.controls}>
        <Button title={`${recording ? 'Stop' : 'Start'} Recording`} onPress={recordAsync} />
        {uri && <Button title="Clear Recording" onPress={() => setUri('')} />}
        {recording && (
          <Button title={`${paused ? 'Resume' : 'Pause'} Recording`} onPress={toggleRecording} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controls: {
    position: 'absolute',
    width: '100%',
    bottom: 10,
    left: 0,
  },
});
