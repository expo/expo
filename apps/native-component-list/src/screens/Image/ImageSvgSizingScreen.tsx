import { Image, ImageLoadOptions, ImageSource, useImage } from 'expo-image';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import MonoText from '../../components/MonoText';

const EXPO_SVG = require('../../../assets/images/expo.svg');
const PIN_SVG = require('../../../assets/images/pin.svg');
const REACT_SVG: ImageSource = {
  uri: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg',
};

const CASES: { label: string; source: ImageSource; options?: ImageLoadOptions }[] = [
  { label: 'expo.svg — no options', source: EXPO_SVG },
  {
    label: 'expo.svg — maxWidth/maxHeight: 64',
    source: EXPO_SVG,
    options: { maxWidth: 64, maxHeight: 64 },
  },
  {
    label: 'expo.svg — maxWidth/maxHeight: 256',
    source: EXPO_SVG,
    options: { maxWidth: 256, maxHeight: 256 },
  },
  { label: 'pin.svg — no options', source: PIN_SVG },
  {
    label: 'pin.svg — maxWidth/maxHeight: 128',
    source: PIN_SVG,
    options: { maxWidth: 128, maxHeight: 128 },
  },
  { label: 'react-icon.svg (remote) — no options', source: REACT_SVG },
  {
    label: 'react-icon.svg (remote) — maxWidth/maxHeight: 64',
    source: REACT_SVG,
    options: { maxWidth: 64, maxHeight: 64 },
  },
];

function Case({ label, source, options }: (typeof CASES)[number]) {
  const image = useImage(source, options);
  return (
    <View style={styles.case}>
      <Text style={styles.label}>{label}</Text>
      <MonoText>
        {image ? `image.width × image.height = ${image.width} × ${image.height}` : '(loading…)'}
      </MonoText>
      <View style={styles.preview}>
        {image && (
          <Image
            source={image}
            style={{
              width: image.width,
              height: image.height,
            }}
            contentFit="contain"
          />
        )}
      </View>
    </View>
  );
}

export default function ImageSvgSizingScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={styles.header}>
        Compare what {`<useImage>`} reports for `image.width` / `image.height` on {Platform.OS},
        with and without `maxWidth`/`maxHeight`.
      </Text>
      {CASES.map((c, i) => (
        <Case key={i} {...c} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 16, fontSize: 13, color: '#444' },
  case: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
    gap: 8,
  },
  label: { fontWeight: '600' },
  preview: {
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: { width: 100, height: 200 },
});
