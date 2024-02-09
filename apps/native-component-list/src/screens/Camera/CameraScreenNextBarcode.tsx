import { CameraView, ScanningResult, ScanningOptions } from 'expo-camera/next';
import Checkbox from 'expo-checkbox';
import { useEffect, useState } from 'react';
import { View, Button, Platform, Text, StyleSheet } from 'react-native';

export default function CameraScreenNextBarcode() {
  const [result, setResult] = useState<ScanningResult | null>(null);
  const [options, setOptions] = useState<ScanningOptions>({
    isGuidanceEnabled: false,
    barcodeTypes: ['qr'],
    isHighlightingEnabled: false,
    isPinchToZoomEnabled: false,
  });

  useEffect(() => {
    const subscription = CameraView.onModernBarcodeScanned((event) => {
      setResult(event);
      if (CameraView.isModernBarcodeScannerAvailable) {
        CameraView.dismissScanner();
      }
    });

    return () => subscription.remove();
  }, []);

  async function launchScanner() {
    if (CameraView.isModernBarcodeScannerAvailable) {
      await CameraView.launchScanner(options);
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
      <View style={{ gap: 20 }}>
        <Button title="Launch Scanner" onPress={launchScanner} />
        <View style={styles.optionRow}>
          <Text style={styles.optionsText}>Guidance Enabled</Text>
          <Checkbox
            value={options.isGuidanceEnabled}
            onValueChange={() =>
              setOptions((opts) => ({ ...opts, isGuidanceEnabled: !options.isGuidanceEnabled }))
            }
          />
        </View>
        <View style={styles.optionRow}>
          <Text style={styles.optionsText}>Highlight Enabled</Text>
          <Checkbox
            value={options.isHighlightingEnabled}
            onValueChange={() =>
              setOptions((opts) => ({
                ...opts,
                isHighlightingEnabled: !options.isHighlightingEnabled,
              }))
            }
          />
        </View>
        <View style={styles.optionRow}>
          <Text style={styles.optionsText}>Pinch to zoom Enabled</Text>
          <Checkbox
            value={options.isPinchToZoomEnabled}
            onValueChange={() =>
              setOptions((opts) => ({
                ...opts,
                isPinchToZoomEnabled: !options.isPinchToZoomEnabled,
              }))
            }
          />
        </View>
      </View>
      {result && <Text>{JSON.stringify(result, null, 2)}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  optionRow: {
    width: '55%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  optionsText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
