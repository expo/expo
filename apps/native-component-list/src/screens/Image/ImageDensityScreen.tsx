import { Image } from 'expo-image';
import React from 'react';
import { Image as RNImage, PixelRatio, ScrollView, StyleSheet, Text, View } from 'react-native';

import Colors from '../../constants/Colors';

// This require() triggers the Metro asset transformer.
// When multi-scale variants exist (@2x, @3x), the transformer emits a static `sources`
// array that expo-image renders as an HTML srcSet with density descriptors (1x, 2x, 3x),
// letting the browser pick the best variant natively.
const densityTestImage = require('../../../assets/images/density-test.png');

export default function ImageDensityScreen() {
  const pixelRatio = PixelRatio.get();

  // Resolve the source to inspect the URI that Metro generated.
  // On web, require() returns a plain object { uri, width, height } directly.
  // On native, it returns a numeric ID that needs resolveAssetSource().
  const resolved =
    typeof densityTestImage === 'object' && densityTestImage?.uri
      ? densityTestImage
      : RNImage.resolveAssetSource(densityTestImage);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.description}>
        This screen tests that static images with @2x/@3x variants are correctly resolved on web.
        The Metro asset transformer emits a sources array, and expo-image renders it as an HTML
        srcSet with density descriptors, letting the browser pick the right variant.
      </Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoLabel}>PixelRatio.get()</Text>
        <Text style={styles.infoValue}>{pixelRatio}</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoLabel}>Resolved URI</Text>
        <Text style={styles.infoValue} selectable>
          {resolved?.uri ?? 'N/A'}
        </Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoLabel}>Resolved dimensions</Text>
        <Text style={styles.infoValue}>
          {resolved ? `${resolved.width} x ${resolved.height}` : 'N/A'}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Auto-resolved variant (via require)</Text>
      <Text style={styles.hint}>
        On a 2x display this should show a red "2x" image. On a 3x display it should show a green
        "3x" image. On 1x it should show a blue "1x" image.
      </Text>
      <View style={styles.imageRow}>
        <View style={styles.imageContainer}>
          <Text style={styles.imageLabel}>expo-image</Text>
          <Image source={densityTestImage} style={styles.image} contentFit="contain" />
        </View>
        <View style={styles.imageContainer}>
          <Text style={styles.imageLabel}>RN Image</Text>
          <RNImage source={densityTestImage} style={styles.image} resizeMode="contain" />
        </View>
      </View>

      <Text style={styles.hint}>Colors: blue = 1x, red = 2x, green = 3x.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.greyBackground,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  description: {
    fontSize: 14,
    color: Colors.secondaryText,
    marginBottom: 16,
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondaryText,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 14,
    color: '#000',
    fontFamily: 'monospace',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 4,
  },
  hint: {
    fontSize: 13,
    color: Colors.secondaryText,
    marginBottom: 12,
    lineHeight: 18,
  },
  imageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageContainer: {
    alignItems: 'center',
    gap: 6,
  },
  imageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondaryText,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    backgroundColor: '#fff',
  },
});
