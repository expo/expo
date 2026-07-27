import { CameraView, DocumentScanningOptions, DocumentScanningResult } from 'expo-camera';
import Checkbox from 'expo-checkbox';
import { File, Paths } from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Alert, Image, Platform, ScrollView, View, Button, StyleSheet } from 'react-native';

import { BodyText } from '../../components/BodyText';

export default function CameraScreenDocumentScanner() {
  const [result, setResult] = useState<DocumentScanningResult | null | undefined>(undefined);
  const [requestPdf, setRequestPdf] = useState(false);

  async function saveAndOpenPdf(pdfUri: string) {
    try {
      const dest = new File(Paths.document, 'scanned-document.pdf');
      await new File(pdfUri).copy(dest, { overwrite: true });

      if (Platform.OS === 'android') {
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: dest.contentUri,
          flags: 1,
          type: 'application/pdf',
        });
      } else {
        await Sharing.shareAsync(dest.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
      }
    } catch (error: any) {
      Alert.alert('Could not open PDF', error.message);
    }
  }

  async function scanDocument() {
    const options: DocumentScanningOptions = { requestPdf };
    try {
      const scanResult = await CameraView.scanDocumentAsync(options);
      setResult(scanResult);
    } catch (error) {
      console.error('Error scanning document:', error);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        gap: 20,
      }}>
      <View style={{ gap: 20 }}>
        <Button
          title="Scan Document"
          onPress={scanDocument}
          disabled={!CameraView.isDocumentScannerAvailable}
        />
        {!CameraView.isDocumentScannerAvailable && (
          <BodyText>Document scanner is unavailable on this device.</BodyText>
        )}
        <View style={styles.optionRow}>
          <BodyText style={styles.optionsText}>Generate PDF</BodyText>
          <Checkbox value={requestPdf} onValueChange={setRequestPdf} />
        </View>
      </View>
      {result === null && <BodyText>Scan cancelled.</BodyText>}
      {result != null && (
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <BodyText>Pages: {result.pages.length}</BodyText>
          {result.pdfUri != null && (
            <View style={{ alignItems: 'center', gap: 10, marginVertical: 10 }}>
              <BodyText>PDF: {result.pdfUri}</BodyText>
              <Button title="Save & Open PDF" onPress={() => saveAndOpenPdf(result.pdfUri!)} />
            </View>
          )}
          <ScrollView horizontal style={{ marginTop: 10, height: 140, flexGrow: 0 }}>
            {result.pages.map((uri, i) => (
              <Image key={i} source={{ uri }} style={styles.thumbnail} resizeMode="contain" />
            ))}
          </ScrollView>
        </View>
      )}
      {result !== undefined && (
        <View style={{ marginTop: 16 }}>
          <Button title="Reset" onPress={() => setResult(undefined)} />
        </View>
      )}
    </ScrollView>
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
  thumbnail: {
    width: 100,
    height: 140,
    marginHorizontal: 4,
  },
});
