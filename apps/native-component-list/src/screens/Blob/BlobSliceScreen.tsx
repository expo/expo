import { Blob } from 'expo-blob';
import { useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';

import HeadingText from '../../components/HeadingText';
import MonoText from '../../components/MonoText';
import { Page } from '../../components/Page';

type SliceExampleData = {
  key: string;
  title: string;
  code: string;
  blobParts: any[];
  options?: any;
  sliceStart?: number;
  sliceEnd?: number;
  sliceContentType?: string;
};

const sliceExamples: SliceExampleData[] = [
  {
    key: 'basic-slice',
    title: 'Basic Blob',
    code: 'new Blob(["squiggle"]).slice(0, 3, "text/plain")',
    blobParts: [new Blob(['squiggle'])],
    options: {
      type: 'text/plain',
      endings: 'native',
    },
    sliceStart: 0,
    sliceEnd: 3,
    sliceContentType: 'text/plain',
  },
  {
    key: 'mixed-blob-slice',
    title: 'Mixed Blob',
    code: 'new Blob([new Uint8Array(..., 3, 5), "squiggle", "foo"]).slice(0, 8, "text/plain")',
    blobParts: (() => {
      const arrayBuffer = new ArrayBuffer(16);
      const int8View = new Int8Array(arrayBuffer);
      for (let i = 0; i < 16; i++) {
        int8View[i] = i + 65;
      }
      const blob1 = new Blob(['squiggle']);
      return [new Uint8Array(arrayBuffer, 3, 5), blob1, 'foo'];
    })(),
    options: {
      type: 'text/plain',
      endings: 'native',
    },
    sliceStart: 0,
    sliceEnd: 8,
    sliceContentType: 'text/plain',
  },
];

type SliceExampleItemProps = {
  example: SliceExampleData;
  result: {
    originalSize: number;
    originalType: string;
    originalText: string;
    slicedSize: number;
    slicedType: string;
    slicedText: string;
  } | null;
  onEvaluate: (example: SliceExampleData) => void;
};

function SliceExampleItem({ example, result, onEvaluate }: SliceExampleItemProps) {
  return (
    <View>
      <Text>{example.title}</Text>
      <View>
        <MonoText>{example.code}</MonoText>
        {!result && <Button title="Evaluate" onPress={() => onEvaluate(example)} />}
        {result && (
          <View>
            <MonoText containerStyle={styles.resultContainer}>
              <Text>Original Size: {result.originalSize}</Text> {'\n'}
              <Text>Original Type: {result.originalType}</Text> {'\n'}
              <Text>Original Text: {result.originalText}</Text> {'\n'}
              <Text>Sliced Size: {result.slicedSize}</Text> {'\n'}
              <Text>Sliced Type: {result.slicedType}</Text> {'\n'}
              <Text>Sliced Text: {result.slicedText}</Text>
            </MonoText>
            <Button title="Re-evaluate" onPress={() => onEvaluate(example)} />
          </View>
        )}
      </View>
    </View>
  );
}

export default function BlobSliceScreen() {
  const [results, setResults] = useState<{
    [key: string]: {
      originalSize: number;
      originalType: string;
      originalText: string;
      slicedSize: number;
      slicedType: string;
      slicedText: string;
    } | null;
  }>({});

  const evaluateSlice = (example: SliceExampleData) => {
    try {
      const blob = new Blob(example.blobParts, example.options);
      const slicedBlob = blob.slice(example.sliceStart, example.sliceEnd, example.sliceContentType);

      blob.text().then((originalText: string) => {
        slicedBlob.text().then((slicedText: string) => {
          setResults((prev) => ({
            ...prev,
            [example.key]: {
              originalSize: blob.size,
              originalType: blob.type,
              originalText,
              slicedSize: slicedBlob.size,
              slicedType: slicedBlob.type,
              slicedText,
            },
          }));
        });
      });
    } catch (error) {
      console.error('Error creating or slicing blob:', error);
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
          <HeadingText>Slice Method</HeadingText>
          <MonoText>slice(start?: number, end?: number, contentType?: string)</MonoText>
        </View>
        <View>
          <HeadingText>Examples:</HeadingText>
          <View style={styles.exmaplesContainer}>
            {sliceExamples.map((example) => (
              <SliceExampleItem
                key={example.key}
                example={example}
                result={results[example.key]}
                onEvaluate={evaluateSlice}
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
});
