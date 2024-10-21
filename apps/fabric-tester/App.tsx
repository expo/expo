import * as AppleAuthentication from 'expo-apple-authentication';
import { ResizeMode, Video } from 'expo-av';
import { BlurView } from 'expo-blur';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Button,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Appearance,
  PlatformColor,
} from 'react-native';

function randomColor() {
  return '#' + ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, '0');
}

export default function App() {
  const [colorScheme, setColorScheme] = useState(Appearance.getColorScheme());
  const isFabricEnabled = global.nativeFabricUIManager != null;

  useEffect(() => {
    const listener = Appearance.addChangeListener((preferences) => {
      setColorScheme(preferences.colorScheme);
    });

    return listener.remove;
  }, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colorScheme === 'light' ? '#fff' : '#161b22' }]}>
      <ScrollView>
        <Text style={[styles.text, { marginVertical: 10 }]}>
          isFabricEnabled: {isFabricEnabled + ''}
        </Text>

        <ImageExample />
        <LinearGradientExample />
        {Platform.OS === 'ios' && <BlurExample />}
        <VideoExample />
        <CameraExample />
        <AppleAuthenticationExample />
      </ScrollView>
    </SafeAreaView>
  );
}

export function ImageExample() {
  const [seed] = useState(100 + Math.round(Math.random() * 100));

  return (
    <View style={styles.exampleContainer}>
      <Image style={styles.image} source={{ uri: `https://picsum.photos/id/${seed}/1000/1000` }} />
    </View>
  );
}

export function LinearGradientExample() {
  const [mounted, setMounted] = useState(true);
  const [colors, setColors] = useState(() => Array(3).fill(0).map(randomColor));

  const toggleMounted = useCallback(() => setMounted(!mounted), [mounted]);
  const randomizeColors = useCallback(() => setColors(Array(3).fill(0).map(randomColor)), [colors]);

  return (
    <View style={styles.exampleContainer}>
      <View style={styles.gradient}>
        {mounted && <LinearGradient style={{ flex: 1 }} colors={colors} end={{ x: 0.5, y: 1.0 }} />}
      </View>

      <View style={styles.buttons}>
        <Button title={mounted ? 'Unmount view' : 'Mount view'} onPress={toggleMounted} />
        <Button title="Randomize colors" onPress={randomizeColors} disabled={!mounted} />
      </View>
    </View>
  );
}

export function BlurExample() {
  const uri = 'https://source.unsplash.com/random';
  const text = "Hello, I'm blurring contents underneath!";

  return (
    <View style={[styles.exampleContainer, styles.blurExample]}>
      <Image style={styles.blurImage} source={{ uri }} />
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
  const [nativeControls, setNativeControls] = useState(true);

  const togglePlaying = useCallback(() => {
    if (status.isPlaying) {
      video.current.pauseAsync();
    } else {
      video.current.playAsync();
    }
  }, [status.isPlaying]);

  const toggleNativeControls = useCallback(
    () => setNativeControls(!nativeControls),
    [nativeControls]
  );

  const setFullscreen = useCallback(() => video.current.presentFullscreenPlayer(true), [video]);

  return (
    <View style={[styles.exampleContainer, styles.videoExample]}>
      <Video
        ref={video}
        style={styles.video}
        source={{
          uri: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
        }}
        useNativeControls={nativeControls}
        resizeMode={ResizeMode.CONTAIN}
        isLooping
        onPlaybackStatusUpdate={(status) => setStatus(() => status)}
      />
      <View style={styles.buttons}>
        <Button title={status.isPlaying ? 'Pause' : 'Play'} onPress={togglePlaying} />
        <Button
          title={nativeControls ? 'Hide controls' : 'Show controls'}
          onPress={toggleNativeControls}
        />
        <Button title="Open fullscreen" onPress={setFullscreen} />
      </View>
    </View>
  );
}

export function CameraExample() {
  const [cameraPermissionStatus, requestCameraPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [cameraType, setCameraType] = useState<CameraType>('back');

  const takePicture = useCallback(async () => {
    const result = await camera.current.takePictureAsync({
      quality: 0.7,
    });
    alert(JSON.stringify(result, null, 2));
  }, []);

  const reverse = useCallback(() => {
    setCameraType(cameraType === 'back' ? 'front' : 'back');
  }, [cameraType]);

  const onCameraReady = useCallback(() => {
    console.log('Camera is ready!');
  }, []);

  if (!cameraPermissionStatus) {
    requestCameraPermission();
    return null;
  }

  return (
    <View style={styles.exampleContainer}>
      <CameraView
        ref={camera}
        style={styles.camera}
        facing={cameraType}
        onCameraReady={onCameraReady}>
        <View style={styles.cameraShutterButtonContainer}>
          <TouchableOpacity style={styles.cameraShutterButton} onPress={takePicture} />
        </View>
      </CameraView>

      <View style={styles.buttons}>
        <Button title="Take picture" onPress={takePicture} />
        <Button
          title={cameraType === 'back' ? 'Switch to front' : 'Switch to back'}
          onPress={reverse}
        />
      </View>
    </View>
  );
}

export function AppleAuthenticationExample() {
  const signIn = useCallback(async () => {
    try {
      await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        state: 'this-is-a-test',
      });
    } catch (error) {
      Alert.alert(error.code, error.message);
    }
  }, []);

  return (
    <View style={styles.exampleContainer}>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <AppleAuthentication.AppleAuthenticationButton
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          cornerRadius={10}
          onPress={signIn}
          style={{ width: 250, height: 44, margin: 15 }}
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
  exampleContainer: {
    padding: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderStyle: 'solid',
    borderColor: '#242c39',
  },
  image: {
    flex: 1,
    height: 200,
  },
  gradient: {
    height: 200,
  },
  blurExample: {
    height: 200,
  },
  blurImage: {
    ...StyleSheet.absoluteFillObject,
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    ...Platform.select({
      ios: { color: PlatformColor('labelColor') },
    }),
  },
  videoExample: {
    justifyContent: 'center',
  },
  video: {
    alignSelf: 'center',
    width: 400,
    height: 200,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    height: 500,
    backgroundColor: 'red',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  cameraShutterButtonContainer: {
    width: 70,
    height: 70,
    margin: 20,
    padding: 3,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: '#fff9',
  },
  cameraShutterButton: {
    flex: 1,
    borderRadius: 35,
    backgroundColor: '#fff',
  },
});
