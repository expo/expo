import { useState } from 'react';
import { Text, View } from 'react-native';

// import 'foobar';

export default function App() {
  return (
    <View style={{ flex: 1, padding: 48 }}>
      <Text
        style={{ fontSize: 24, backgroundColor: 'darkcyan', color: 'white', padding: 16 }}
        onPress={() => {
          // @ts-expect-error
          undefined();
        }}>
        Runtime error: undefined is not a function
      </Text>

      <MountOnPress title="React: undefined component">{() => <RErrUndef />}</MountOnPress>
      <MountOnPress title="React: error in render">{() => <RErrThrowInRender />}</MountOnPress>
      <MountOnPress title="React: missing keys">{() => <RWarningMissingKeys />}</MountOnPress>
      <MountOnPress title="React: async client component">
        {() => <RBugAsyncComponent />}
      </MountOnPress>
    </View>
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
