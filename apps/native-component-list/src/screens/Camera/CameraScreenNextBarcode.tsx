import { CameraView } from 'expo-camera/next';
import { useEffect } from 'react';
import { View, Button, Platform, Text } from 'react-native';

export default function CameraScreenNextBarcode() {
  useEffect(() => {
    const subscription = CameraView.onModernBarcodeScanned((event) => {
      console.log(event);
    });

    return () => subscription.remove();
  }, []);

  async function launchScanner() {
    if (CameraView.isModernBarcodeScannerAvailable) {
      await CameraView.launchModernScanner({
        barCodeTypes: ['qr'],
        isHighlightingEnabled: true,
      });
    }
  }

  if (Platform.OS === 'android') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold' }}>This API is unavailable on Android</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button title="Launch Scanner" onPress={launchScanner} />
    </View>
  );
}
