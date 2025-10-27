import { Color } from 'expo';
import { Platform, Text, useColorScheme, View } from 'react-native';

import { Page, Section } from '../components/Page';

export default function ColorScreen() {
  // Needed to trigger re-render on color scheme change on Android
  useColorScheme();
  const colors = Platform.select({
    ios: [
      { label: 'systemBlue', bg: Color.ios.systemBlue, text: '#fff' },
      { label: 'systemRed', bg: Color.ios.systemRed, text: '#fff' },
      { label: 'systemGreen', bg: Color.ios.systemGreen, text: '#fff' },
      { label: 'systemBackground', bg: Color.ios.systemBackground, text: Color.ios.label },
    ],
    android: [
      {
        label: 'primary',
        bg: Color.android.material.primary,
        text: Color.android.material.onPrimary,
      },
      {
        label: 'primary - dynamic',
        bg: Color.android.material.dynamic.primary,
        text: Color.android.material.dynamic.onPrimary,
      },
      {
        label: 'secondary',
        bg: Color.android.material.secondary,
        text: Color.android.material.onSecondary,
      },
      {
        label: 'secondary - dynamic',
        bg: Color.android.material.dynamic.secondary,
        text: Color.android.material.dynamic.onSecondary,
      },
      { label: 'error', bg: Color.android.material.error, text: Color.android.material.onError },
      {
        label: 'error - dynamic',
        bg: Color.android.material.dynamic.error,
        text: Color.android.material.dynamic.onError,
      },
      {
        label: 'surface',
        bg: Color.android.material.surface,
        text: Color.android.material.onSurface,
      },
      {
        label: 'surface - dynamic',
        bg: Color.android.material.dynamic.surface,
        text: Color.android.material.dynamic.onSurface,
      },
    ],
    default: [],
  });

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Platform.select({
          ios: Color.ios.systemBackground,
          android: Color.android.material.dynamic.surface,
          default: '#fff',
        }),
      }}>
      <Page>
        <Section title="Colors">
          {colors.map((color, index) => (
            <View key={index} style={{ backgroundColor: color.bg ?? undefined, padding: 16 }}>
              <Text style={{ color: color.text ?? undefined }}>{color.label}</Text>
            </View>
          ))}
        </Section>
      </Page>
    </View>
  );
}

ColorScreen.navigationOptions = {
  title: 'Colors',
};
