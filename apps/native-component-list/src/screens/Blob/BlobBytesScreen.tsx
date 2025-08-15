import { Blob } from 'expo-blob';
import { useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';

import HeadingText from '../../components/HeadingText';
import MonoText from '../../components/MonoText';
import { Page } from '../../components/Page';

type BytesExampleData = {
  key: string;
  title: string;
  code: string;
  blobParts: any[];
  options?: any;
};

const bytesExamples: BytesExampleData[] = [
  {
    key: 'simple-bytes',
    title: 'Simple Bytes',
    code: 'new Blob(["Hello World"]).bytes()',
    blobParts: ['Hello World'],
    options: {
      type: 'text/plain',
    },
  },
  {
    key: 'unicode-bytes',
    title: 'Unicode Bytes',
    code: 'new Blob(["Hello 🌍 世界"]).bytes()',
    blobParts: ['Hello 🌍 世界'],
    options: {
      type: 'text/plain; charset=utf-8',
    },
  },
  {
    key: 'mixed-bytes',
    title: 'Mixed Content Bytes',
    code: 'new Blob(["Text", new Uint8Array([65, 66, 67]), "More"]).bytes()',
    blobParts: ['Text', new Uint8Array([65, 66, 67]), 'More'],
    options: {
      type: 'text/plain',
    },
  },
  {
    key: 'binary-bytes',
    title: 'Binary Data Bytes',
    code: 'new Blob([new Uint8Array([72, 101, 108, 108, 111])]).bytes()',
    blobParts: [new Uint8Array([72, 101, 108, 108, 111])],
    options: {
      type: 'application/octet-stream',
    },
  },
  {
    key: 'json-bytes',
    title: 'JSON Bytes',
    code: 'new Blob([JSON.stringify({name: "John", age: 30})]).bytes()',
    blobParts: [JSON.stringify({ name: 'John', age: 30 })],
    options: {
      type: 'application/json',
    },
  },
];

type BytesExampleItemProps = {
  example: BytesExampleData;
  result: {
    size: number;
    type: string;
    text: string;
    bytes: Uint8Array | null;
    hexString: string;
  } | null;
  onEvaluate: (example: BytesExampleData) => void;
};

function BytesExampleItem({ example, result, onEvaluate }: BytesExampleItemProps) {
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
              <Text>Hex: {result.hexString}</Text> {'\n'}
              <Text>Bytes: {result.bytes ? Array.from(result.bytes).join(', ') : 'null'}</Text>
            </MonoText>
            <Button title="Re-evaluate" onPress={() => onEvaluate(example)} />
          </View>
        )}
      </View>
    </View>
  );
}

function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join(' ');
}

export default function BlobBytesScreen() {
  const [results, setResults] = useState<{
    [key: string]: {
      size: number;
      type: string;
      text: string;
      bytes: Uint8Array | null;
      hexString: string;
    } | null;
  }>({});

  const evaluateBytes = (example: BytesExampleData) => {
    try {
      const blob = new Blob(example.blobParts, example.options);

      blob.text().then((text: string) => {
        blob.bytes().then((bytes: Uint8Array) => {
          setResults((prev) => ({
            ...prev,
            [example.key]: {
              size: blob.size,
              type: blob.type,
              text,
              bytes,
              hexString: uint8ArrayToHex(bytes),
            },
          }));
        });
      });
    } catch (error) {
      console.error('Error creating blob or reading bytes:', error);
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
          <HeadingText>Bytes Method</HeadingText>
          <MonoText>bytes()</MonoText>
        </View>
        <View>
          <HeadingText>Examples:</HeadingText>
          <View style={styles.exmaplesContainer}>
            {bytesExamples.map((example) => (
              <BytesExampleItem
                key={example.key}
                example={example}
                result={results[example.key]}
                onEvaluate={evaluateBytes}
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
