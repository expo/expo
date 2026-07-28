import { CameraView, type CameraCapturedPicture } from 'expo-camera';
import { Image as ExpoImage } from 'expo-image';
import React, { useRef, useState } from 'react';
import { View, StyleSheet, Button, Text, Image, ScrollView } from 'react-native';

type Check = { label: string; ok: boolean; detail: string };

function getDecodedSize(uri: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}

export default function CameraScreenCaptureDimensions() {
  const ref = useRef<CameraView>(null);
  const [photo, setPhoto] = useState<CameraCapturedPicture | null>(null);
  const [checks, setChecks] = useState<Check[]>([]);
  const [error, setError] = useState<string | undefined>();

  const takePicture = async () => {
    if (!ref.current) {
      return;
    }
    setError(undefined);
    try {
      const result = await ref.current.takePictureAsync({ exif: true, quality: 1 });
      if (!result?.uri) {
        setError('No image returned');
        return;
      }
      setPhoto(result);

      const decoded = await getDecodedSize(result.uri);
      const exif = result.exif ?? {};
      const pixelX = exif.PixelXDimension;
      const pixelY = exif.PixelYDimension;
      const orientation = exif.Orientation;

      const sameSet = (a: [number, number], b: [number, number]) =>
        (a[0] === b[0] && a[1] === b[1]) || (a[0] === b[1] && a[1] === b[0]);
      const quarterTurn = typeof orientation === 'number' && orientation >= 5 && orientation <= 8;

      setChecks([
        {
          label: 'Returned size matches the encoded file',
          ok: sameSet([result.width, result.height], [decoded.width, decoded.height]),
          detail: `returned ${result.width}×${result.height}, file ${decoded.width}×${decoded.height}`,
        },
        {
          label: 'EXIF pixel dimensions are consistent with the orientation tag',
          ok: quarterTurn
            ? pixelX === result.height && pixelY === result.width
            : pixelX === result.width && pixelY === result.height,
          detail: `orientation ${orientation}, exif ${pixelX}×${pixelY}, returned ${result.width}×${result.height}`,
        },
        {
          label: 'EXIF orientation tag is present and valid',
          ok: typeof orientation === 'number' && orientation >= 1 && orientation <= 8,
          detail: `orientation ${orientation}`,
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.row}>
        <CameraView style={styles.camera} ref={ref} />
        {photo && <ExpoImage source={{ uri: photo.uri }} style={styles.picture} />}
      </View>
      <Button onPress={takePicture} title="Take Picture" />
      {error && <Text style={styles.error}>{error}</Text>}
      {checks.length > 0 && (
        <View style={styles.infoBox}>
          {checks.map((check) => (
            <View key={check.label} style={styles.checkRow}>
              <Text style={styles.checkMark}>{check.ok ? '✅' : '❌'}</Text>
              <View style={styles.checkText}>
                <Text style={styles.checkLabel}>{check.label}</Text>
                <Text style={styles.checkDetail}>{check.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 10,
  },
  row: {
    height: 300,
    flexDirection: 'row',
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
  error: {
    margin: 10,
    color: 'red',
  },
  infoBox: {
    padding: 10,
    margin: 10,
    backgroundColor: '#f0f2f0',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'black',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  checkMark: {
    fontSize: 20,
    marginRight: 8,
  },
  checkText: {
    flex: 1,
  },
  checkLabel: {
    fontWeight: 'bold',
  },
  checkDetail: {
    color: '#555',
  },
});
