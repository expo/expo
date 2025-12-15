import { Asset } from 'expo-asset';
import { Blob as ExpoBlob } from 'expo-blob';
import { useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';

import HeadingText from '../../components/HeadingText';
import MonoText from '../../components/MonoText';
import { Page } from '../../components/Page';

type PerformanceTestData = {
  key: string;
  blobOperation: () => Promise<number>;
  expoBlobOperation: () => Promise<number>;
  title: string;
  iterations: number;
};

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve(result);
      }
    };
    reader.readAsDataURL(blob);
  });
}

const performanceTest: PerformanceTestData[] = [
  {
    key: 'basic-test',
    blobOperation: async () => {
      const T0 = performance.now();
      const blob = new Blob(['abcd'.repeat(50000)]);
      blob.slice(0, 500000).slice(0, 50_000).slice(0, 40_000).slice(0, 30_000);
      const T1 = performance.now();
      return T1 - T0;
    },
    expoBlobOperation: async () => {
      const T0 = performance.now();
      const blob = new ExpoBlob(['abcd'.repeat(50000)]);
      blob.slice(0, 500000).slice(0, 50_000).slice(0, 40_000).slice(0, 30_000);
      const T1 = performance.now();
      return T1 - T0;
    },
    title: 'String Test',
    iterations: 100,
  },
  {
    key: 'bmp-file-test',
    blobOperation: async () => {
      const asset = Asset.fromModule(require('../../../assets/expo-blob/performance-test-2mb.bmp'));
      await asset.downloadAsync();
      const uri = asset.localUri || asset.uri;
      const response = await fetch(uri);
      const blobResponse = await response.blob();
      const base64 = await blobToBase64(blobResponse);

      const T0 = performance.now();
      const blob = new Blob([base64]);
      blob.slice(0, 1000);
      const T1 = performance.now();
      return T1 - T0;
    },
    expoBlobOperation: async () => {
      const asset = Asset.fromModule(require('../../../assets/expo-blob/performance-test-2mb.bmp'));
      await asset.downloadAsync();
      const uri = asset.localUri || asset.uri;
      const response = await fetch(uri);
      const blobResponse = await response.blob();
      const base64 = await blobToBase64(blobResponse);

      const T0 = performance.now();
      const blob = new ExpoBlob([base64]);
      blob.slice(0, 1000);
      const T1 = performance.now();
      return T1 - T0;
    },
    title: 'File Test (2MB BMP)',
    iterations: 5,
  },
  {
    key: 'audio-file-test',
    blobOperation: async () => {
      const asset = Asset.fromModule(require('../../../assets/expo-blob/performance-test-1mb.mp3'));
      await asset.downloadAsync();
      const uri = asset.localUri || asset.uri;
      const response = await fetch(uri);
      const blobResponse = await response.blob();
      const base64 = await blobToBase64(blobResponse);

      const T0 = performance.now();
      const blob = new Blob([base64]);
      blob.slice(0, 1000);
      const T1 = performance.now();
      return T1 - T0;
    },
    expoBlobOperation: async () => {
      const asset = Asset.fromModule(require('../../../assets/expo-blob/performance-test-1mb.mp3'));
      await asset.downloadAsync();
      const uri = asset.localUri || asset.uri;
      const response = await fetch(uri);
      const blobResponse = await response.blob();
      const base64 = await blobToBase64(blobResponse);

      const T0 = performance.now();
      const blob = new ExpoBlob([base64]);
      blob.slice(0, 1000);
      const T1 = performance.now();
      return T1 - T0;
    },
    title: 'File Test (1MB Audio)',
    iterations: 25,
  },
  {
    key: 'video-file-test',
    blobOperation: async () => {
      const asset = Asset.fromModule(
        require('../../../assets/expo-blob/performance-test-video-1mb.mp4')
      );
      await asset.downloadAsync();
      const uri = asset.localUri || asset.uri;
      const response = await fetch(uri);
      const blobResponse = await response.blob();
      const base64 = await blobToBase64(blobResponse);

      const T0 = performance.now();
      const blob = new Blob([base64]);
      blob.slice(0, 1000);
      const T1 = performance.now();
      return T1 - T0;
    },
    expoBlobOperation: async () => {
      const asset = Asset.fromModule(
        require('../../../assets/expo-blob/performance-test-video-1mb.mp4')
      );
      await asset.downloadAsync();
      const uri = asset.localUri || asset.uri;
      const response = await fetch(uri);
      const blobResponse = await response.blob();
      const base64 = await blobToBase64(blobResponse);

      const T0 = performance.now();
      const blob = new ExpoBlob([base64]);
      blob.slice(0, 1000);
      const T1 = performance.now();
      return T1 - T0;
    },
    title: 'File Test (1MB Video)',
    iterations: 25,
  },
];

type ArrayBufferExampleItemProps = {
  example: PerformanceTestData;
  result: {
    blobTime: number;
    expoBlobTime: number;
  } | null;
  onEvaluate: (example: PerformanceTestData) => void;
};

function ArrayBufferExampleItem({ example, result, onEvaluate }: ArrayBufferExampleItemProps) {
  return (
    <View>
      <Text>{example.title}</Text>
      <View>
        {!result && <Button title="Evaluate" onPress={() => onEvaluate(example)} />}
        {result && (
          <View>
            <MonoText containerStyle={styles.resultContainer}>
              <Text>Blob time: {result.blobTime.toFixed(6)} ms</Text> {'\n'}
              <Text>Expo Blob time: {result.expoBlobTime.toFixed(6)} ms</Text> {'\n'}
            </MonoText>
            <Button title="Re-evaluate" onPress={() => onEvaluate(example)} />
          </View>
        )}
      </View>
    </View>
  );
}

export default function BlobArrayBufferScreen() {
  const [results, setResults] = useState<{
    [key: string]: {
      blobTime: number;
      expoBlobTime: number;
    } | null;
  }>({});

  const evaluatePerformanceTest = async (example: PerformanceTestData) => {
    try {
      let expoBlobTotal = 0;
      let blobTotal = 0;
      for (let i = 0; i < example.iterations; i++) {
        expoBlobTotal += await example.expoBlobOperation();
        blobTotal += await example.blobOperation();
      }
      setResults((prev) => ({
        ...prev,
        [example.key]: {
          blobTime: blobTotal / example.iterations,
          expoBlobTime: expoBlobTotal / example.iterations,
        },
      }));
    } catch (error) {
      console.error('Error in performance test', error);
      setResults((prev) => ({
        ...prev,
        [example.key]: null,
      }));
    }
  };

  return (
    <Page>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View>
          <HeadingText>Performance tests:</HeadingText>
          <View style={styles.exmaplesContainer}>
            {performanceTest.map((example) => (
              <ArrayBufferExampleItem
                key={example.key}
                example={example}
                result={results[example.key]}
                onEvaluate={evaluatePerformanceTest}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingBottom: 20,
  },
  exmaplesContainer: {
    marginTop: 10,
    gap: 10,
  },
  exampleContent: {
    flexDirection: 'row',
  },
  resultContainer: {
    borderColor: '#229D2AFF',
    padding: 10,
    borderRadius: 5,
  },
  iterationsInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 4,
    minWidth: 60,
    marginLeft: 8,
  },
});
