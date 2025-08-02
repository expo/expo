import { Blob } from 'expo-blob';
import { useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';

import HeadingText from '../../components/HeadingText';
import MonoText from '../../components/MonoText';
import { Page } from '../../components/Page';

type ExampleData = {
  key: string;
  title: string;
  code: string;
  blobParts: any[];
  options?: any;
};

const examples: ExampleData[] = [
  {
    key: 'nested',
    title: 'Nested Array',
    code: 'new Blob(["a", "bbb", "d", ["edf", ["aaaa"]]])',
    blobParts: ['a', 'bbb', 'd', ['edf', ['aaaa']]],
  },
  {
    key: 'mixed',
    title: 'Mixed Types Array',
    code: 'new Blob(["a", "bbb", new Uint8Array([64, 65, 66])])',
    blobParts: ['a', 'bbb', new Uint8Array([64, 65, 66])],
  },
  {
    key: 'blobs',
    title: 'Blobs Array',
    code: 'new Blob([new Blob(["aaa"]), new Blob(["bbb"])])',
    blobParts: [new Blob(['aaa']), new Blob(['bbb'])],
  },
];

type ExampleItemProps = {
  example: ExampleData;
  result: { size: number; type: string; text: string } | null;
  onEvaluate: (key: string, blobParts: any[], options?: any) => void;
};

function ExampleItem({ example, result, onEvaluate }: ExampleItemProps) {
  return (
    <View>
      <Text>{example.title}</Text>
      <View>
        <MonoText>{example.code}</MonoText>
        {!result && (
          <Button
            title="Evaluate"
            onPress={() => onEvaluate(example.key, example.blobParts, example.options)}
          />
        )}
        {result && (
          <View>
            <MonoText containerStyle={styles.resultContainer}>
              <Text>Size: {result.size}</Text> {'\n'}
              <Text>Type: {result.type}</Text> {'\n'}
              <Text>Text: {result.text}</Text>
            </MonoText>
            <Button
              title="Re-evaluate"
              onPress={() => onEvaluate(example.key, example.blobParts, example.options)}
            />
          </View>
        )}
      </View>
    </View>
  );
}

export default function BlobConstructorScreen() {
  const [results, setResults] = useState<{
    [key: string]: { size: number; type: string; text: string } | null;
  }>({});

  const evaluateBlob = (key: string, blobParts: any[], options?: any) => {
    try {
      const blob = new Blob(blobParts, options);
      blob.text().then((text: string) => {
        setResults((prev) => ({
          ...prev,
          [key]: {
            size: blob.size,
            type: blob.type,
            text,
          },
        }));
      });
    } catch (error) {
      console.error('Error creating blob:', error);
      setResults((prev) => ({
        ...prev,
        [key]: null,
      }));
    }
  };

  const handleEvaluate = (key: string, blobParts: any[], options?: any) => {
    evaluateBlob(key, blobParts, options);
  };

  return (
    <Page>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View>
          <HeadingText>Blob Constructor</HeadingText>
          <MonoText>new Blob(blobParts?: BlobPart[], {'\n  '}options?: BlobPropertyBag)</MonoText>
        </View>
        <View>
          <HeadingText>Examples:</HeadingText>
          <View style={styles.exmaplesContainer}>
            {examples.map((example) => (
              <ExampleItem
                key={example.key}
                example={example}
                result={results[example.key]}
                onEvaluate={handleEvaluate}
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
