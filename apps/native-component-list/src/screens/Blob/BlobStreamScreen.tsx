import { Blob } from 'expo-blob';
import { useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';

import HeadingText from '../../components/HeadingText';
import MonoText from '../../components/MonoText';
import { Page } from '../../components/Page';

type StreamExampleData = {
  key: string;
  title: string;
  code: string;
  blobParts: any[];
  options?: any;
  sliceStart?: number;
  sliceEnd?: number;
};

const streamExamples: StreamExampleData[] = [
  {
    key: 'basic-stream',
    title: 'Basic Stream Example',
    code: 'new Blob(["aaa", "bbbb"]).slice(0, 5).stream()',
    blobParts: ['aaa', 'bbbb'],
    options: {
      type: 'test/plain',
      endings: 'native',
    },
    sliceStart: 0,
    sliceEnd: 5,
  },
];

type StreamExampleItemProps = {
  example: StreamExampleData;
  result: {
    size: number;
    type: string;
    text: string;
    streamData: Uint8Array | null;
  } | null;
  onEvaluate: (example: StreamExampleData) => void;
};

function StreamExampleItem({ example, result, onEvaluate }: StreamExampleItemProps) {
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
              <Text>
                Stream: {result.streamData ? Array.from(result.streamData).join(', ') : 'null'}
              </Text>
            </MonoText>
            <Button title="Re-evaluate" onPress={() => onEvaluate(example)} />
          </View>
        )}
      </View>
    </View>
  );
}

async function readStream(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

export default function BlobStreamScreen() {
  const [results, setResults] = useState<{
    [key: string]: {
      size: number;
      type: string;
      text: string;
      streamData: Uint8Array | null;
    } | null;
  }>({});

  const evaluateStream = (example: StreamExampleData) => {
    try {
      const blob = new Blob(example.blobParts, example.options);
      const slicedBlob =
        example.sliceStart !== undefined && example.sliceEnd !== undefined
          ? blob.slice(example.sliceStart, example.sliceEnd)
          : blob;

      slicedBlob.text().then((text: string) => {
        readStream(slicedBlob.stream())
          .then((streamData: Uint8Array) => {
            setResults((prev) => ({
              ...prev,
              [example.key]: {
                size: slicedBlob.size,
                type: slicedBlob.type,
                text,
                streamData,
              },
            }));
          })
          .catch((error) => {
            console.error('Error reading stream:', error);
            setResults((prev) => ({
              ...prev,
              [example.key]: {
                size: slicedBlob.size,
                type: slicedBlob.type,
                text,
                streamData: null,
              },
            }));
          });
      });
    } catch (error) {
      console.error('Error creating blob or stream:', error);
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
          <HeadingText>Stream Method</HeadingText>
          <MonoText>stream()</MonoText>
        </View>
        <View>
          <HeadingText>Examples:</HeadingText>
          <View style={styles.exmaplesContainer}>
            {streamExamples.map((example) => (
              <StreamExampleItem
                key={example.key}
                example={example}
                result={results[example.key]}
                onEvaluate={evaluateStream}
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
    padding: 20,
    borderRadius: 5,
  },
});
