import { requireOptionalNativeModule } from 'expo';
import { getExpoV2Demo } from 'expo-v2-demo';
import { ScrollView, StyleSheet } from 'react-native';

import HeadingText from '../../components/HeadingText';
import MonoText from '../../components/MonoText';

function describeExpoV2Demo(): string {
  const demo = getExpoV2Demo();
  if (!demo) {
    return 'expo.modules.ExpoV2Demo is not installed';
  }

  try {
    const point = demo.translate({ x: 1, y: 2 }, 10, 20);

    return [
      `add(2, 3) = ${demo.add(2, 3)}`,
      `greet('native-component-list') = ${demo.greet('native-component-list')}`,
      `translate({ x: 1, y: 2 }, 10, 20) = { x: ${point.x}, y: ${point.y} }`,
    ].join('\n');
  } catch (error: any) {
    return `failed: ${error?.message ?? String(error)}`;
  }
}

export default function ExpoModulesV2Screen() {
  return (
    <ScrollView style={styles.scrollView}>
      <HeadingText>ExpoV2Demo</HeadingText>
      <MonoText>{describeExpoV2Demo()}</MonoText>

      <HeadingText>Shared namespace</HeadingText>
      <MonoText>
        {[
          `Object.keys(expo.modules) has ExpoV2Demo = ${Object.keys((globalThis as any).expo?.modules ?? {}).includes('ExpoV2Demo')}`,
          `requireOptionalNativeModule('ExpoAsset') = ${typeof requireOptionalNativeModule('ExpoAsset')}`,
        ].join('\n')}
      </MonoText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    padding: 10,
  },
});
