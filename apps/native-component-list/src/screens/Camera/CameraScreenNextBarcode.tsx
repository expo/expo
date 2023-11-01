import { Camera } from 'expo-camera/next';
import { useEffect } from 'react';
import { View, Button } from 'react-native';

export default function CameraScreenNextBarcode() {
  useEffect(() => {
    const subscription = Camera.onModernBarcodeScanned((event) => {
      console.log(event);
    });

    return () => subscription.remove();
  }, []);

  async function launchScanner() {
    if (Camera.modernBarcodeScannerAvailable) {
      await Camera.launchModernScanner({
        barCodeTypes: ['qr'],
        isHighlightingEnabled: true,
      });
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button title="Launch Scanner" onPress={launchScanner} />
    </View>
  );
}
