import { ScrollView, StyleSheet, View } from 'react-native';

import HeadingText from '../../components/HeadingText';
import MonoText from '../../components/MonoText';

// Custom JSON replacer that can stringify functions.
const customJsonReplacer = (_: string, value: any) => {
  return typeof value === 'function' ? value.toString().replace(/\s+/g, ' ') : value;
};

function CheckIfPresent({ name }: { name: string }) {
  return <MonoText>{`'${name}' in globalThis.expo => ${name in globalThis.expo!}`}</MonoText>;
}

export default function ExpoModulesScreen() {
  const modules = { ...globalThis.expo?.modules };
  const moduleNames = Object.keys(modules);

  return (
    <ScrollView style={styles.scrollView}>
      <HeadingText>Host object is installed</HeadingText>
      <CheckIfPresent name="modules" />

      <HeadingText>Exported classes</HeadingText>
      {['EventEmitter', 'SharedObject', 'SharedRef', 'NativeModule'].map((className) => (
        <CheckIfPresent key={className} name={className} />
      ))}

      <HeadingText>Available Expo modules</HeadingText>
      <MonoText>
        {`Object.keys(global.expo.modules) => [\n  ${moduleNames.join(',\n  ')}\n]`}
      </MonoText>

      {moduleNames.map((moduleName) => {
        return (
          <View key={moduleName}>
            <HeadingText>Module: {moduleName}</HeadingText>
            <MonoText>{JSON.stringify(modules[moduleName], customJsonReplacer, 2)}</MonoText>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    paddingHorizontal: 10,
  },
});
