import { Blob } from 'expo-blob';
import { useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';

import HeadingText from '../../components/HeadingText';
import MonoText from '../../components/MonoText';
import { Page } from '../../components/Page';

type TextExampleData = {
  key: string;
  title: string;
  code: string;
  blobParts: any[];
  options?: any;
};

const textExamples: TextExampleData[] = [
  {
    key: 'simple-text',
    title: 'Simple Text',
    code: 'new Blob(["Hello", " ", "World"]).text()',
    blobParts: ['Hello', ' ', 'World'],
    options: {
      type: 'text/plain',
    },
  },
  {
    key: 'unicode-text',
    title: 'Unicode Text',
    code: 'new Blob(["Hello", " ", "🌍", " ", "世界"]).text()',
    blobParts: ['Hello', ' ', '🌍', ' ', '世界'],
    options: {
      type: 'text/plain; charset=utf-8',
    },
  },
  {
    key: 'mixed-content',
    title: 'Mixed Content',
    code: 'new Blob(["Text", new Uint8Array([65, 66, 67]), "More"]).text()',
    blobParts: ['Text', new Uint8Array([65, 66, 67]), 'More'],
    options: {
      type: 'text/plain',
    },
  },
  {
    key: 'json-content',
    title: 'JSON Content',
    code: 'new Blob([JSON.stringify({name: "John", age: 30})]).text()',
    blobParts: [JSON.stringify({ name: 'John', age: 30 })],
    options: {
      type: 'application/json',
    },
  },
  {
    key: 'html-content',
    title: 'HTML Content',
    code: 'new Blob(["<h1>", "Hello", "</h1>"]).text()',
    blobParts: ['<h1>', 'Hello', '</h1>'],
    options: {
      type: 'text/html',
    },
  },
];

type TextExampleItemProps = {
  example: TextExampleData;
  result: {
    size: number;
    type: string;
    text: string;
  } | null;
  onEvaluate: (example: TextExampleData) => void;
};

function TextExampleItem({ example, result, onEvaluate }: TextExampleItemProps) {
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
              <Text>Text: {result.text}</Text>
            </MonoText>
            <Button title="Re-evaluate" onPress={() => onEvaluate(example)} />
          </View>
        )}
      </View>
    </View>
  );
}

export default function BlobTextScreen() {
  const [results, setResults] = useState<{
    [key: string]: {
      size: number;
      type: string;
      text: string;
    } | null;
  }>({});

  const evaluateText = (example: TextExampleData) => {
    try {
      const blob = new Blob(example.blobParts, example.options);
      blob
        .text()
        .then((text: string) => {
          setResults((prev) => ({
            ...prev,
            [example.key]: {
              size: blob.size,
              type: blob.type,
              text,
            },
          }));
        })
        .catch((error) => {
          console.error('Error reading text:', error);
          setResults((prev) => ({
            ...prev,
            [example.key]: {
              size: blob.size,
              type: blob.type,
              text: 'Error reading text',
            },
          }));
        });
    } catch (error) {
      console.error('Error creating blob:', error);
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
          <HeadingText>Text Method</HeadingText>
          <MonoText>text()</MonoText>
        </View>
        <View>
          <HeadingText>Examples:</HeadingText>
          <View style={styles.exmaplesContainer}>
            {textExamples.map((example) => (
              <TextExampleItem
                key={example.key}
                example={example}
                result={results[example.key]}
                onEvaluate={evaluateText}
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
