import React from 'react';
import { StyleSheet, ScrollView, Platform } from 'react-native';

import BlurViewWithControls from './BlurViewWithControls';

const blurStyles =
  Platform.OS === 'ios'
    ? ([
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
      ] as const)
    : (['light', 'dark', 'default'] as const);

export default function BlurViewScreen() {
  return (
    <ScrollView style={styles.container}>
      {blurStyles.map((tint) => (
        <BlurViewWithControls key={tint} tint={tint} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
