import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { ExperimentalBlurMethod } from 'expo-blur';
import React from 'react';
import { StyleSheet, ScrollView, Text, Platform } from 'react-native';

import BlurViewWithControls from './BlurViewWithControls';

const blurStyles = [
  'light',
  'dark',
  'default',
  'extraLight',
  'regular',
  'prominent',
  'systemUltraThinMaterial',
  'systemThinMaterial',
  'systemMaterial',
  'systemThickMaterial',
  'systemChromeMaterial',
  'systemUltraThinMaterialLight',
  'systemThinMaterialLight',
  'systemMaterialLight',
  'systemThickMaterialLight',
  'systemChromeMaterialLight',
  'systemUltraThinMaterialDark',
  'systemThinMaterialDark',
  'systemMaterialDark',
  'systemThickMaterialDark',
  'systemChromeMaterialDark',
] as const;

export default function BlurViewScreen() {
  const [blurMethod, setBlurMethod] = React.useState(ExperimentalBlurMethod.None);
  return (
    <ScrollView style={styles.container}>
      {Platform.OS === 'android' && (
        <>
          <Text style={styles.text}>Blur method:</Text>
          <SegmentedControl
            values={Object.keys(ExperimentalBlurMethod)}
            selectedIndex={Object.values(ExperimentalBlurMethod).indexOf(blurMethod)}
            onChange={(event) => {
              setBlurMethod(
                ExperimentalBlurMethod[
                  event.nativeEvent.value as keyof typeof ExperimentalBlurMethod
                ]
              );
            }}
          />
        </>
      )}
      {blurStyles.map((tint) => (
        <BlurViewWithControls key={tint} tint={tint} blurMethod={blurMethod} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  text: {
    marginLeft: 10,
  },
});
