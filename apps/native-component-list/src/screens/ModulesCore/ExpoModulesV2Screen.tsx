import { getExpoV2Demo } from 'expo-v2-demo';
import { ScrollView, StyleSheet } from 'react-native';

import HeadingText from '../../components/HeadingText';
import MonoText from '../../components/MonoText';

function describeExpoV2Demo(): string {
  const demo = getExpoV2Demo();
  if (!demo) {
    return 'expoV2.modules.ExpoV2Demo is not installed';
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

      <HeadingText>Runtime globals</HeadingText>
      <MonoText>
        {[
          `typeof expoV2.modules = ${typeof (globalThis as any).expoV2?.modules}`,
          `typeof expo.modules = ${typeof (globalThis as any).expo?.modules}`,
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
