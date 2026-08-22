import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { SharingOptions } from 'expo-sharing';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useResolvedValue } from '../utilities/useResolvedValue';

type ShareExample = {
  id: string;
  title: string;
  fixture: ShareFixture;
  localName: string;
  options: SharingOptions;
  note: string;
  iosOnly?: boolean;
};

type ShareFixture = {
  module: number;
  path: string;
};

type ShareSection = {
  title: string;
  examples: ShareExample[];
};

const fixtures = {
  jpeg: {
    module: require('../../assets/images/example1.jpg'),
    path: 'assets/images/example1.jpg',
  },
  png: {
    module: require('../../assets/images/chapeau.png'),
    path: 'assets/images/chapeau.png',
  },
  webp: {
    module: require('../../assets/images/example4.webp'),
    path: 'assets/images/example4.webp',
  },
  svg: {
    module: require('../../assets/images/expo.svg'),
    path: 'assets/images/expo.svg',
  },
  mp4: {
    module: require('../../assets/expo-blob/performance-test-video-1mb.mp4'),
    path: 'assets/expo-blob/performance-test-video-1mb.mp4',
  },
  mov: {
    module: require('../../assets/videos/tola_seek_optimized.mov'),
    path: 'assets/videos/tola_seek_optimized.mov',
  },
  pdf: {
    module: require('../../assets/sharing/document.pdf'),
    path: 'assets/sharing/document.pdf',
  },
  html: {
    module: require('../../assets/index.html'),
    path: 'assets/index.html',
  },
  mp3: {
    module: require('../../assets/expo-blob/performance-test-1mb.mp3'),
    path: 'assets/expo-blob/performance-test-1mb.mp3',
  },
};

const sections: ShareSection[] = [
  {
    title: 'Images',
    examples: [
      {
        id: 'jpeg-extensionless-input',
        title: 'JPEG · extensionless input',
        fixture: fixtures.jpeg,
        localName: 'jpeg-no-extension',
        options: { mimeType: 'image/jpeg' },
        note: 'Declares image/jpeg for a cache input without an extension',
      },
      {
        id: 'jpeg-correct-extension',
        title: 'JPEG · matching .jpg',
        fixture: fixtures.jpeg,
        localName: 'photo.jpg',
        options: {},
        note: 'The filename extension is used to infer the file type',
      },
      {
        id: 'jpeg-conflicting-extension',
        title: 'JPEG · conflicting .pdf input',
        fixture: fixtures.jpeg,
        localName: 'photo.pdf',
        options: { mimeType: 'image/jpeg' },
        note: 'iOS appends .jpg; Android sends image/jpeg on the Intent',
      },
      {
        id: 'png-correct-extension',
        title: 'PNG · matching .png',
        fixture: fixtures.png,
        localName: 'icon.png',
        options: { mimeType: 'image/png' },
        note: 'Ordinary local file sharing path',
      },
      {
        id: 'png-extensionless-input-uti',
        title: 'PNG · extensionless input + UTI',
        fixture: fixtures.png,
        localName: 'png-with-uti',
        options: { UTI: 'public.png' },
        note: 'iOS uses the UTI to stage the input with a .png extension',
        iosOnly: true,
      },
      {
        id: 'webp-correct-extension',
        title: 'WebP · matching .webp',
        fixture: fixtures.webp,
        localName: 'thumbnail.webp',
        options: {},
        note: 'Modern image format with a matching filename',
      },
      {
        id: 'svg-correct-extension',
        title: 'SVG · matching .svg',
        fixture: fixtures.svg,
        localName: 'expo.svg',
        options: {},
        note: 'Vector image file',
      },
    ],
  },
  {
    title: 'Video',
    examples: [
      {
        id: 'mp4-correct-extension',
        title: 'MP4 · matching .mp4',
        fixture: fixtures.mp4,
        localName: 'video.mp4',
        options: {},
        note: 'Ordinary MP4 file',
      },
      {
        id: 'mp4-extensionless-input',
        title: 'MP4 · extensionless input',
        fixture: fixtures.mp4,
        localName: 'mp4-no-extension',
        options: { mimeType: 'video/mp4' },
        note: 'Declares video/mp4 for a cache input without an extension',
      },
      {
        id: 'mp4-conflicting-extension',
        title: 'MP4 · conflicting .jpg input',
        fixture: fixtures.mp4,
        localName: 'video.jpg',
        options: { mimeType: 'video/mp4' },
        note: 'iOS appends .mp4; Android sends video/mp4 on the Intent',
      },
      {
        id: 'quicktime-extensionless-input-uti',
        title: 'QuickTime · extensionless input + UTI',
        fixture: fixtures.mov,
        localName: 'quicktime-no-extension',
        options: { UTI: 'com.apple.quicktime-movie' },
        note: 'iOS uses the UTI to stage the input with a .mov extension',
        iosOnly: true,
      },
    ],
  },
  {
    title: 'Documents and audio',
    examples: [
      {
        id: 'pdf-correct-extension',
        title: 'PDF · matching .pdf',
        fixture: fixtures.pdf,
        localName: 'document.pdf',
        options: { mimeType: 'application/pdf' },
        note: 'Ordinary PDF file',
      },
      {
        id: 'pdf-extensionless-input-uti',
        title: 'PDF · extensionless input + UTI',
        fixture: fixtures.pdf,
        localName: 'pdf-no-extension',
        options: { UTI: 'com.adobe.pdf' },
        note: 'iOS stages the input with .pdf before presenting Quick Look',
        iosOnly: true,
      },
      {
        id: 'text-extensionless-input',
        title: 'Text · extensionless input',
        fixture: fixtures.html,
        localName: 'plain-text-no-extension',
        options: { mimeType: 'text/plain' },
        note: 'Declares text/plain for an extensionless HTML-backed cache input',
      },
      {
        id: 'html-correct-extension',
        title: 'HTML · matching .html',
        fixture: fixtures.html,
        localName: 'document.html',
        options: { mimeType: 'text/html' },
        note: 'Existing text asset with its matching filename extension',
      },
      {
        id: 'mp3-extensionless-input',
        title: 'MP3 · extensionless input',
        fixture: fixtures.mp3,
        localName: 'audio-no-extension',
        options: { mimeType: 'audio/mpeg' },
        note: 'Declares audio/mpeg for a cache input without an extension',
      },
      {
        id: 'generic-binary',
        title: 'HTML bytes · generic .bin',
        fixture: fixtures.html,
        localName: 'generic.bin',
        options: { mimeType: 'application/octet-stream' },
        note: 'Shares the HTML fixture as application/octet-stream without changing its bytes',
      },
    ],
  },
];

function declaredType(options: SharingOptions): string {
  return options.UTI ?? options.mimeType ?? 'not declared - auto-derived from filename';
}

export default function SharingScreen() {
  const [isSharingAvailable, availabilityError] = useResolvedValue(Sharing.isAvailableAsync);
  const [activeExampleId, setActiveExampleId] = useState<string>();
  const [status, setStatus] = useState('Choose a local file to share.');

  const availabilityMessage = availabilityError
    ? `Unable to check sharing availability: ${availabilityError.message}`
    : isSharingAvailable === null
      ? 'Checking sharing availability…'
      : !isSharingAvailable
        ? 'Sharing is not available on this platform.'
        : !FileSystem.cacheDirectory
          ? 'Local file sharing requires a file-system cache, which is not available on this platform.'
          : null;

  const handleShare = async (example: ShareExample) => {
    if (!FileSystem.cacheDirectory) {
      setStatus('File system unavailable. A cache directory is required to share files.');
      return;
    }

    setActiveExampleId(example.id);
    setStatus(`Preparing ${example.title}…`);

    const destinationUrl = `${FileSystem.cacheDirectory}expo-sharing-${example.localName}`;

    try {
      const asset = Asset.fromModule(example.fixture.module);
      await asset.downloadAsync();
      if (!asset.localUri) {
        throw new Error(`Local asset is unavailable: ${example.fixture.path}`);
      }

      await FileSystem.deleteAsync(destinationUrl, { idempotent: true });
      await FileSystem.copyAsync({
        from: asset.localUri,
        to: destinationUrl,
      });

      setStatus(`Sharing ${example.localName} as ${declaredType(example.options)}…`);
      await Sharing.shareAsync(destinationUrl, {
        dialogTitle: example.title,
        ...example.options,
      });
      setStatus(`Finished: ${example.title}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`Failed: ${example.title}`);
      console.error('Unable to share file: ' + message);
    } finally {
      setActiveExampleId(undefined);
    }
  };

  if (availabilityMessage) {
    return (
      <View style={styles.availabilityContainer}>
        {isSharingAvailable === null && !availabilityError ? (
          <ActivityIndicator size="small" color="#0a7ea4" />
        ) : null}
        <Text style={styles.availabilityMessage}>{availabilityMessage}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      style={styles.screen}>
      <Text style={styles.title}>Sharing file matrix</Text>
      <Text style={styles.intro}>
        Each bundled fixture is copied to the cache using the local filename shown. A declared MIME
        type or UTI tests how the native share module stages that input; otherwise the type is
        inferred from its filename. UTI examples are shown only on iOS. All fixtures work offline.
      </Text>
      <View style={styles.statusCard}>
        {activeExampleId ? <ActivityIndicator size="small" color="#0a7ea4" /> : null}
        <Text style={styles.status}>{status}</Text>
      </View>

      {sections.map((section) => {
        const visibleExamples = section.examples.filter(
          (example) => !example.iosOnly || Platform.OS === 'ios'
        );

        return (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {visibleExamples.map((example) => {
              const isActive = activeExampleId === example.id;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Share ${example.title}`}
                  disabled={activeExampleId !== undefined}
                  key={example.id}
                  onPress={() => handleShare(example)}
                  style={({ pressed }) => [
                    styles.card,
                    pressed && styles.cardPressed,
                    activeExampleId !== undefined && !isActive && styles.cardDisabled,
                  ]}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{example.title}</Text>
                    {isActive ? <ActivityIndicator size="small" color="#0a7ea4" /> : null}
                  </View>
                  <Text style={styles.type}>{declaredType(example.options)}</Text>
                  <Text style={styles.filename}>Local: {example.localName}</Text>
                  <Text numberOfLines={1} style={styles.source}>
                    Source: {example.fixture.path}
                  </Text>
                  <Text style={styles.note}>{example.note}</Text>
                </Pressable>
              );
            })}
          </View>
        );
      })}
    </ScrollView>
  );
}

SharingScreen.navigationOptions = {
  title: 'Sharing',
};

const styles = StyleSheet.create({
  availabilityContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
    backgroundColor: '#f5f5f7',
  },
  availabilityMessage: {
    color: '#555',
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  content: {
    gap: 18,
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 48,
  },
  title: {
    color: '#111',
    fontSize: 28,
    fontWeight: '700',
  },
  intro: {
    color: '#555',
    fontSize: 15,
    lineHeight: 21,
  },
  statusCard: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#e5f5fb',
  },
  status: {
    flex: 1,
    color: '#07566f',
    fontSize: 14,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    marginTop: 4,
    color: '#111',
    fontSize: 20,
    fontWeight: '700',
  },
  card: {
    gap: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d7d7dc',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#fff',
  },
  cardPressed: {
    opacity: 0.65,
  },
  cardDisabled: {
    opacity: 0.45,
  },
  cardHeader: {
    minHeight: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitle: {
    flex: 1,
    color: '#111',
    fontSize: 16,
    fontWeight: '600',
  },
  type: {
    color: '#0a7ea4',
    fontSize: 13,
    fontWeight: '600',
  },
  filename: {
    color: '#333',
    fontFamily: 'Menlo',
    fontSize: 12,
  },
  source: {
    color: '#707078',
    fontSize: 11,
  },
  note: {
    color: '#707078',
    fontSize: 13,
    lineHeight: 18,
  },
});
