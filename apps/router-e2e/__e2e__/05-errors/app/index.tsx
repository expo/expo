import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import * as hmr_fixtures from '@expo/metro-runtime/fixtures/hmr-fixtures';
import HMRClient from '@expo/metro-runtime/src/HMRClient';
// import './foobar';

// eval('clasfs Foo {}');

export default function App() {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ gap: 8, padding: 48 }}
      contentInsetAdjustmentBehavior="automatic">
      <BigButton
        title="Runtime error: undefined is not a function"
        onPress={() => {
          // @ts-expect-error
          undefined();
        }}
      />
      <BigButton
        title="Runtime error: accessing undefined variable"
        onPress={() => {
          // @ts-expect-error
          console.log(undefinedVariable);
        }}
      />

      <BigButton
        title="Build error: syntax error"
        onPress={() => {
          HMRClient._onMetroError(hmr_fixtures.syntax_error);
        }}
      />
      <BigButton
        title="Build error: import missing file"
        onPress={() => {
          HMRClient._onMetroError(hmr_fixtures.missing_file);
        }}
      />
      <BigButton
        title="Build error: import missing node module"
        onPress={() => {
          HMRClient._onMetroError(hmr_fixtures.missing_node_module);
        }}
      />

      <BigButton
        title="console.error: string"
        onPress={() => {
          console.error('Hello');
        }}
      />
      <BigButton
        title="console.error: Error"
        onPress={() => {
          console.error(new Error('Hello'));
        }}
      />

      <MountOnPress title="React: undefined component">{() => <RErrUndef />}</MountOnPress>
      <MountOnPress title="React: error in render">{() => <RErrThrowInRender />}</MountOnPress>
      <MountOnPress title="React: missing keys">{() => <RWarningMissingKeys />}</MountOnPress>
      <MountOnPress title="React: async client component">
        {() => <RBugAsyncComponent />}
      </MountOnPress>
      <MountOnPress title="React Native: invalid element">
        {() => <RNBugInvalidDomElement />}
      </MountOnPress>
      <MountOnPress title="React Native: unwrapped text">
        {() => <RNBugUnwrappedText />}
      </MountOnPress>
    </ScrollView>
  );
}

function BigButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Text
      style={{ fontSize: 24, backgroundColor: 'darkcyan', color: 'white', padding: 16 }}
      onPress={onPress}>
      {title}
    </Text>
  );
}

function MountOnPress({ title, children }: { title: string; children: () => React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  return (
    <View
      style={{
        padding: 8,
        backgroundColor: 'white',
        borderWidth: 3,
        borderStyle: 'dashed',
        borderColor: 'darkseagreen',
      }}>
      <Text
        style={{ fontSize: 24, backgroundColor: 'darkcyan', color: 'white', padding: 16 }}
        onPress={() => {
          setIsMounted(true);
        }}>
        {title}
      </Text>
      {isMounted && children()}
    </View>
  );
}

const Broken = undefined;

function RErrUndef() {
  return <Broken />;
}
function RErrThrowInRender() {
  throw new Error('Error in render');
}

function RWarningMissingKeys() {
  return (
    <>
      {Array.from({ length: 3 }, (_, i) => (
        <View style={{ padding: 8, backgroundColor: 'white' }}></View>
      )).reverse()}
    </>
  );
}

async function RBugAsyncComponent() {
  return <Text>Hello</Text>;
}
function RNBugInvalidDomElement() {
  return <bacon />;
}
function RNBugUnwrappedText() {
  return <View>Hello</View>;
}
