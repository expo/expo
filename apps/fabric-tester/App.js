import { Video } from 'expo-av';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import {
  Button,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';

function randomColor() {
  return '#' + ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, '0');
}

export default class App extends React.PureComponent {
  state = {
    reverse: false,
    mounted: true,
    colors: Array(3).fill(0).map(randomColor),
  };

  toggleMounted = () => {
    this.setState((state) => ({ mounted: !state.mounted }));
  };

  randomizeColors = () => {
    this.setState({ colors: Array(3).fill(0).map(randomColor) });
  };

  render() {
    const { reverse, mounted, colors } = this.state;
    const isFabricEnabled = global.nativeFabricUIManager != null;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <Text style={[styles.text, { marginVertical: 40 }]}>
            isFabricEnabled: {isFabricEnabled + ''}
          </Text>

          <Button title={mounted ? 'Unmount view' : 'Mount view'} onPress={this.toggleMounted} />
          <Button title="Randomize colors" onPress={this.randomizeColors} disabled={!mounted} />

          {mounted && (
            <LinearGradient
              style={styles.gradient}
              colors={colors}
              end={reverse ? { x: 1.0, y: 0.5 } : { x: 0.5, y: 1.0 }}
            />
          )}

          {/* <BlueExample /> */}
          {/* <VideoExample /> */}
        </ScrollView>
      </SafeAreaView>
    );
  }
}

export function BlueExample() {
  const uri = 'https://s3.amazonaws.com/exp-icon-assets/ExpoEmptyManifest_192.png';
  const text = 'Hello, my container is blurring contents underneath!';

  return (
    <View style={styles.blurExample}>
      <Image style={[StyleSheet.absoluteFill, styles.image]} source={{ uri }} />
      <BlurView intensity={100} style={styles.blurContainer}>
        <Text style={styles.text}>{text}</Text>
      </BlurView>
      <BlurView intensity={80} tint="light" style={styles.blurContainer}>
        <Text style={styles.text}>{text}</Text>
      </BlurView>
      <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
        <Text style={[styles.text, { color: '#fff' }]}>{text}</Text>
      </BlurView>
    </View>
  );
}

export function VideoExample() {
  const video = useRef(null);
  const [status, setStatus] = useState({});
  return (
    <View style={styles.videoExample}>
      <Video
        ref={video}
        style={styles.video}
        source={{
          uri: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
        }}
        useNativeControls
        resizeMode="contain"
        isLooping
        onPlaybackStatusUpdate={(status) => setStatus(() => status)}
      />
      <View style={styles.buttons}>
        <Button
          title={status.isPlaying ? 'Pause' : 'Play'}
          onPress={() =>
            status.isPlaying ? video.current.pauseAsync() : video.current.playAsync()
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight,
  },
  scrollContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  gradient: {
    height: 300,
    margin: 20,
  },
  blurExample: {
    height: 640,
    marginTop: 64,
    flexDirection: 'column',
    alignSelf: 'stretch',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  videoExample: {
    height: 640,
    marginTop: 64,
    justifyContent: 'center',
    backgroundColor: '#ecf0f1',
  },
  video: {
    alignSelf: 'center',
    width: 320,
    height: 200,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
