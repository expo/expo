import { CameraView, PictureRef } from 'expo-camera';
import { Image } from 'expo-image';
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Button, Text } from 'react-native';

export default function CameraScreenImageRef() {
  const ref = useRef<CameraView>(null);
  const [picture, setPicture] = useState<PictureRef | null>(null);
  const [saveInfo, setSaveInfo] = useState<string | undefined>();

  useEffect(() => {
    ref.current?.getAvailablePictureSizesAsync().then((sizes) => {
      console.log({ sizes });
    });
  }, []);

  const takePicture = async () => {
    if (ref.current) {
      const picture = await ref.current.takePictureAsync({
        pictureRef: true,
        quality: 1,
      });

      setPicture(picture);
    }
  };

  const savePicture = async () => {
    const result = await picture?.savePictureAsync();
    setSaveInfo(JSON.stringify(result, null, 2));
  };

  return (
    <View style={styles.screen}>
      <View style={{ height: 300, flexDirection: 'row' }}>
        <CameraView style={styles.camera} ref={ref} pictureSize="1920x1440" />
        <Image source={picture} style={styles.picture} />
      </View>
      <Button onPress={takePicture} title="Take Picture" />
      <Button onPress={savePicture} title="Save Image" />
      {saveInfo && (
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Image Info</Text>
          <Text>{saveInfo}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  camera: {
    flex: 1,
    margin: 10,
    borderRadius: 10,
    borderColor: 'black',
    borderWidth: 2,
  },
  picture: {
    flex: 1,
    margin: 10,
    borderColor: 'black',
    borderWidth: 2,
    borderRadius: 10,
  },
  infoBox: {
    padding: 10,
    margin: 10,
    backgroundColor: '#f0f2f0',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'black',
  },
  infoTitle: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
