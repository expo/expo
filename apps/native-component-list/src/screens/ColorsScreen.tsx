import { Color } from 'expo';
import { Platform, Text, useColorScheme, View } from 'react-native';

import { Page, Section } from '../components/Page';

export default function ColorScreen() {
  // Needed to trigger re-render on color scheme change on Android
  const scheme = useColorScheme();
  const colors = Platform.select({
    ios: [
      { label: 'systemBlue', bg: Color.ios.systemBlue, text: '#fff' },
      { label: 'systemRed', bg: Color.ios.systemRed, text: '#fff' },
      { label: 'systemGreen', bg: Color.ios.systemGreen, text: '#fff' },
      { label: 'systemBackground', bg: Color.ios.systemBackground, text: Color.ios.label },
    ],
    android: [
      {
        label: 'primary attr',
        bg: Color.android.attr.colorPrimary,
        text:
          scheme === 'dark'
            ? Color.android.attr.system_on_primary_dark
            : Color.android.attr.system_on_primary_light,
      },
      {
        label: 'primary system',
        bg:
          scheme === 'dark'
            ? Color.android.system_primary_dark
            : Color.android.system_primary_light,
        text:
          scheme === 'dark'
            ? Color.android.attr.system_on_primary_dark
            : Color.android.attr.system_on_primary_light,
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
          android: Color.android.attr.colorBackground,
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
