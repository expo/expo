import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'expo-modules-core';
import { useRef, useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { captureRef as takeSnapshotAsync, captureScreen } from 'react-native-view-shot';

import Button from '../components/Button';

// Source: https://codepen.io/zessx/pen/rDEAl <3
const gradientColors = ['#90dffe', '#38a3d1'] as const;

export default function ViewShotScreen() {
  const view = useRef<View>();
  const [image, setImage] = useState<string>();
  const [screenUri, setScreenUri] = useState<string>();

  const handlePress = async () => {
    try {
      const image = await takeSnapshotAsync(view.current!, {
        format: 'png',
        quality: 0.5,
        result: 'data-uri',
      });
      setImage(image);
    } catch (e) {
      console.error(e);
    }
  };

  const handleScreenCapturePress = async () => {
    if (Platform.OS === 'web') {
      try {
        const screenUri = await takeSnapshotAsync(undefined as unknown as number, {
          format: 'jpg',
          quality: 0.8,
          result: 'data-uri',
        });
        setScreenUri(screenUri);
      } catch (e) {
        console.error(e);
      }
      return;
    }
    const uri = await captureScreen({
      format: 'jpg',
      quality: 0.8,
    });
    setScreenUri(uri);
  };

  const handleAddToMediaLibraryPress = async () => {
    if (screenUri) {
      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status === 'granted') {
        await MediaLibrary.createAssetAsync(screenUri);
        alert('Successfully added captured screen to media library');
      } else {
        alert('Media library permissions not granted');
      }
    }
  };

  const imageSource = { uri: image };
  return (
    <ScrollView contentContainerStyle={{ alignItems: 'center' }}>
      <View
        style={styles.snapshotContainer}
        collapsable={false}
        // @ts-expect-error
        ref={view}>
        <LinearGradient colors={gradientColors} style={styles.gradient} start={[0, 0]} end={[0, 1]}>
          <Image style={styles.snapshot} source={imageSource} />
          <Text style={styles.text}>Snapshot will show above</Text>
        </LinearGradient>
      </View>
      <Button style={styles.button} onPress={handlePress} title="TAKE THE (SNAP)SHOT!" />
      <Button
        style={styles.button}
        onPress={handleScreenCapturePress}
        title="Capture whole screen"
      />
      <Image
        style={{
          width: Dimensions.get('window').width,
          height: Dimensions.get('window').height,
          borderColor: '#f00',
          borderWidth: 10,
        }}
        source={{ uri: screenUri }}
      />
      <Button
        style={styles.button}
        disabled={!screenUri}
        onPress={handleAddToMediaLibraryPress}
        title="Add to media library"
      />
    </ScrollView>
  );
}

ViewShotScreen.navigationOptions = {
  title: 'ViewShot',
};

const styles = StyleSheet.create({
  snapshotContainer: {
    height: 200,
    alignSelf: 'stretch',
    alignItems: 'stretch',
    justifyContent: 'space-around',
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
  },
  snapshot: {
    width: 150,
    height: 150,
  },
  text: {
    margin: 10,
    color: '#fff',
    fontWeight: '700',
  },
  button: {
    margin: 15,
  },
});
