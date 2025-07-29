import { Blob } from 'expo-blob';
import { useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';

import HeadingText from '../../components/HeadingText';
import MonoText from '../../components/MonoText';
import { Page } from '../../components/Page';

type ArrayBufferExampleData = {
  key: string;
  title: string;
  code: string;
  blobParts: any[];
  options?: any;
};

const arrayBufferExamples: ArrayBufferExampleData[] = [
  {
    key: 'simple-arraybuffer',
    title: 'Simple ArrayBuffer',
    code: 'new Blob(["Hello World"]).arrayBuffer()',
    blobParts: ['Hello World'],
    options: {
      type: 'text/plain',
    },
  },
  {
    key: 'unicode-arraybuffer',
    title: 'Unicode ArrayBuffer',
    code: 'new Blob(["Hello 🌍 世界"]).arrayBuffer()',
    blobParts: ['Hello 🌍 世界'],
    options: {
      type: 'text/plain; charset=utf-8',
    },
  },
  {
    key: 'mixed-arraybuffer',
    title: 'Mixed Content ArrayBuffer',
    code: 'new Blob(["Text", new Uint8Array([65, 66, 67]), "More"]).arrayBuffer()',
    blobParts: ['Text', new Uint8Array([65, 66, 67]), 'More'],
    options: {
      type: 'text/plain',
    },
  },
  {
    key: 'binary-arraybuffer',
    title: 'Binary Data ArrayBuffer',
    code: 'new Blob([new Uint8Array([72, 101, 108, 108, 111])]).arrayBuffer()',
    blobParts: [new Uint8Array([72, 101, 108, 108, 111])],
    options: {
      type: 'application/octet-stream',
    },
  },
  {
    key: 'json-arraybuffer',
    title: 'JSON ArrayBuffer',
    code: 'new Blob([JSON.stringify({name: "John", age: 30})]).arrayBuffer()',
    blobParts: [JSON.stringify({ name: 'John', age: 30 })],
    options: {
      type: 'application/json',
    },
  },
];

type ArrayBufferExampleItemProps = {
  example: ArrayBufferExampleData;
  result: {
    size: number;
    type: string;
    text: string;
    arrayBuffer: ArrayBufferLike | null;
    hexString: string;
  } | null;
  onEvaluate: (example: ArrayBufferExampleData) => void;
};

function ArrayBufferExampleItem({ example, result, onEvaluate }: ArrayBufferExampleItemProps) {
  return (
    <View>
      <Text>{example.title}</Text>
      <View>
        <MonoText>{example.code}</MonoText>
        {!result && <Button title="Evaluate" onPress={() => onEvaluate(example)} />}
        {result && (
          <View>
            <MonoText containerStyle={styles.resultContainer}>
              <Text>Size: {result.size}</Text> {'\n'}
              <Text>Type: {result.type}</Text> {'\n'}
              <Text>Text: {result.text}</Text> {'\n'}
              <Text>Hex: {result.hexString}</Text>
            </MonoText>
            <Button title="Re-evaluate" onPress={() => onEvaluate(example)} />
          </View>
        )}
      </View>
    </View>
  );
}

function arrayBufferToHex(buffer: ArrayBufferLike): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join(' ');
}

export default function BlobArrayBufferScreen() {
  const [results, setResults] = useState<{
    [key: string]: {
      size: number;
      type: string;
      text: string;
      arrayBuffer: ArrayBufferLike | null;
      hexString: string;
    } | null;
  }>({});

  const evaluateArrayBuffer = (example: ArrayBufferExampleData) => {
    try {
      const blob = new Blob(example.blobParts, example.options);

      blob.text().then((text: string) => {
        blob.arrayBuffer().then((arrayBuffer: ArrayBufferLike) => {
          setResults((prev) => ({
            ...prev,
            [example.key]: {
              size: blob.size,
              type: blob.type,
              text,
              arrayBuffer,
              hexString: arrayBufferToHex(arrayBuffer),
            },
          }));
        });
      });
    } catch (error) {
      console.error('Error creating blob or reading arrayBuffer:', error);
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
          <HeadingText>ArrayBuffer Method</HeadingText>
          <MonoText>arrayBuffer()</MonoText>
        </View>
        <View>
          <HeadingText>Examples:</HeadingText>
          <View style={styles.exmaplesContainer}>
            {arrayBufferExamples.map((example) => (
              <ArrayBufferExampleItem
                key={example.key}
                example={example}
                result={results[example.key]}
                onEvaluate={evaluateArrayBuffer}
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
