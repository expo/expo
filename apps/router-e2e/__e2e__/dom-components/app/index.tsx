import { useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';

import Actions from '../components/02-actions';
import LocalAsset from '../components/03-local-asset';
import Tailwind from '../components/04-tailwind';
import PublicAsset from '../components/05-public-asset';
import NestedComponents from '../components/06-nested';
import ForwardRef, { type ForwardedImperativeRef } from '../components/07-forward-ref';
import NativeModuleProxy from '../components/08-native-module-proxy';
import RouterDemo from '../components/09-router';

export default function Page() {
  const [index, setIndex] = useState(0);
  const forwardedRef = useRef<ForwardedImperativeRef>(null);
  const searchParams = useLocalSearchParams();
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, padding: 56 }}>
      <TestCase name="Actions">
        <Actions
          dom={{ matchContents: true }}
          index={index}
          setIndexAsync={async (index) => setIndex(index)}
          showAlert={(time) => {
            alert('Hello, world! ' + time);
          }}
          throwError={() => {
            throw new Error('hey');
          }}
          getNativeSettings={async () => {
            return 'native setting';
          }}
        />
        <Button
          title={`Increment on native: ${index}`}
          onPress={() => setIndex((index) => index + 1)}
        />
      </TestCase>

      <TestCase name="Local Asset">
        <Text style={styles.testcaseHint}>
          Large height div with a centered local asset image. Please test scrolling for
          matchContents.
        </Text>
        <LocalAsset dom={{ matchContents: true }} />
      </TestCase>

      <TestCase name="Public Asset">
        <PublicAsset dom={{ matchContents: true }} />
      </TestCase>

      <TestCase name="Tailwind">
        <Tailwind dom={{ matchContents: true }} />
      </TestCase>

      <TestCase name="Nested">
        <NestedComponents dom={{ matchContents: true }} />
      </TestCase>

      <TestCase name="forwardRef">
        <ForwardRef dom={{ matchContents: true }} ref={forwardedRef} />
        <Button
          title="Toggle width"
          onPress={() => {
            forwardedRef.current?.toggleWidth();
          }}
        />
        <Button
          title="Update text"
          onPress={() => {
            forwardedRef.current?.updateText(Date.now().toString());
          }}
        />
        <Button
          title="Update color using webView ref"
          onPress={() => {
            const hue = Math.floor(Math.random() * 360);
            const saturation = 100;
            const lightness = 85;
            forwardedRef.current?.injectJavaScript(`
              (function() {
                document.getElementById('rect').style.backgroundColor = 'hsl(${hue}, ${saturation}%, ${lightness}%)';
              })();`);
          }}
        />
      </TestCase>

      <TestCase name="NativeModuleProxy">
        <NativeModuleProxy dom={{ matchContents: true, useExpoDOMWebView: true }} />
      </TestCase>
      <TestCase name="Router">
        <RouterDemo
          dom={{ matchContents: true, useExpoDOMWebView: true }}
          searchParams={searchParams}
        />
      </TestCase>
    </ScrollView>
  );
}

function TestCase({ name, children }) {
  return (
    <View style={styles.testcaseContainer}>
      <Text style={styles.testcaseLabel}>{name}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  testcaseContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testcaseLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#4A90E2',
  },
  testcaseHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
});
