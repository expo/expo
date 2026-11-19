import Ionicons from '@react-native-vector-icons/ionicons';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { useTheme } from 'ThemeProvider';
import * as Font from 'expo-font';
import { RenderToImageResult, useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { useState, useEffect, Fragment } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  View,
  Image as CoreImage,
  Text,
  type LayoutChangeEvent,
  type TextStyle,
} from 'react-native';

import { BodyText } from '../components/BodyText';
import { Page, Section } from '../components/Page';
import { ExpoVectorIconsCompatibilitySection } from './ExpoVectorIconsCompatibilitySection';

const round = (num: number) => Math.round(num * 100) / 100;

export default function FontScreen() {
  const { theme } = useTheme();
  const color = theme.text.default;

  const renderedFontAsImage = useLoadIcon(() =>
    Font.renderToImageAsync('ÅBÇD', {
      fontFamily: 'Inter-BoldItalic',
      size: 100,
    })
  );

  const renderedFontAsImageLineHeight100 = useLoadIcon(() =>
    Font.renderToImageAsync('ÅBÇD', {
      fontFamily: 'Inter-BoldItalic',
      size: 100,
      lineHeight: 100,
    })
  );

  const renderedFontAsImageLineHeight150 = useLoadIcon(() =>
    Font.renderToImageAsync('ÅBÇD', {
      fontFamily: 'Inter-BoldItalic',
      size: 100,
      lineHeight: 150,
    })
  );

  return (
    <ScrollView style={{ flex: 1 }}>
      <Page>
        <Section title="loadAsync">
          <BodyText style={{ fontFamily: 'space-mono', fontSize: 16 }}>
            Font icons sets and other custom fonts can be loaded from the web
          </BodyText>
          <BodyText style={{ fontFamily: 'Roboto', fontSize: 16 }}>
            Font icons sets and other custom fonts can be loaded by providing remote uri as well.
          </BodyText>
          {Platform.OS === 'ios' && (
            <BodyText
              adjustsFontSizeToFit
              numberOfLines={2}
              style={{
                fontFamily: 'space-mono',
                fontSize: 420,
              }}>
              Custom font with `adjustsFontSizeToFit` on iOS
            </BodyText>
          )}
          {Platform.OS === 'ios' && (
            <BodyText
              adjustsFontSizeToFit
              numberOfLines={1}
              style={{
                fontFamily: 'Roboto',
                fontSize: 420,
              }}>
              Custom remote uri font with `adjustsFontSizeToFit` on iOS
            </BodyText>
          )}
        </Section>
        <Section title="Ionicons">
          <View style={styles.vectorIconsRow}>
            <Ionicons name="search-sharp" size={25} color={color} />
            <Ionicons name="share-outline" size={25} color={color} />
            <Ionicons name="thunderstorm-outline" size={25} color={color} />
            <Ionicons name="volume-medium" size={25} color={color} />
            <Ionicons name="wine-sharp" size={25} color={color} />
            <Ionicons name="newspaper-outline" size={25} color={color} />
          </View>
          <View style={styles.vectorIconsRow}>
            <Ionicons name="logo-facebook" size={25} color={color} />
            <Ionicons name="logo-apple" size={25} color={color} />
            <Ionicons name="logo-amazon" size={25} color={color} />
            <Ionicons name="logo-npm" size={25} color={color} />
            <Ionicons name="logo-google" size={25} color={color} />
            <Ionicons name="alarm" size={25} color={color} />
          </View>
        </Section>
        <Section title="Material Design Icons">
          <View style={styles.vectorIconsRow}>
            <MaterialCommunityIcons name="emoticon-wink" size={25} color={color} />
            <MaterialCommunityIcons name="map" size={25} color={color} />
            <MaterialCommunityIcons name="food-drumstick" size={25} color={color} />
            <MaterialCommunityIcons name="basketball" size={25} color={color} />
            <MaterialCommunityIcons name="bike" size={25} color={color} />
            <MaterialCommunityIcons name="home" size={25} color={color} />
          </View>
          <View style={styles.vectorIconsRow}>
            <MaterialCommunityIcons name="paw" size={25} color={color} />
            <MaterialCommunityIcons name="camera" size={25} color={color} />
            <MaterialCommunityIcons name="cat" size={25} color={color} />
            <MaterialCommunityIcons name="horse" size={25} color={color} />
            <MaterialCommunityIcons name="react" size={25} color={color} />
            <MaterialCommunityIcons name="apple" size={25} color={color} />
          </View>
        </Section>
        <ExpoVectorIconsCompatibilitySection color={color} />
        <Section title="Custom Fonts">
          <View style={styles.customFonts}>
            <View style={{ flex: 1 }}>
              {/* Loaded from .otf files in asset directory */}
              <BodyText style={{ fontFamily: 'Inter-ThinItalic', fontSize: 16 }}>
                Inter-ThinItalic
              </BodyText>
              <BodyText style={{ fontFamily: 'Inter-BoldItalic', fontSize: 16 }}>
                Inter-BoldItalic
              </BodyText>
              <BodyText style={{ fontFamily: 'Inter-ExtraBoldItalic', fontSize: 16 }}>
                Inter-ExtraBoldItalic
              </BodyText>
              {/* Loaded from @expo-google-fonts/inter */}
              <BodyText style={{ fontFamily: 'Inter_500Medium', fontSize: 16 }}>
                Inter_500Medium
              </BodyText>
              <BodyText style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16 }}>
                Inter_600SemiBold
              </BodyText>
              <BodyText style={{ fontFamily: 'Inter_800ExtraBold', fontSize: 16 }}>
                Inter_800ExtraBold
              </BodyText>
              <BodyText style={{ fontFamily: 'Inter_900Black', fontSize: 16 }}>
                Inter_900Black
              </BodyText>
            </View>
            <View style={{ flex: 1 }}>
              <BodyText style={{ fontFamily: 'OpenSans_Condensed-SemiBold', fontSize: 16 }}>
                OpenSans_Condensed-SemiBold
              </BodyText>
              <BodyText style={{ fontFamily: 'OpenSans_Condensed-BoldItalic', fontSize: 16 }}>
                OpenSans_Condensed-BoldItalic
              </BodyText>
              <BodyText style={{ fontFamily: 'OpenSans-Light', fontSize: 16 }}>
                OpenSans-Light
              </BodyText>
              <BodyText style={{ fontFamily: 'OpenSans-Medium', fontSize: 16 }}>
                OpenSans-Medium
              </BodyText>
              <BodyText style={{ fontFamily: 'OpenSans-SemiBold', fontSize: 16 }}>
                OpenSans-SemiBold
              </BodyText>

              <BodyText style={{ fontFamily: 'OpenSans-ExtraBoldItalic', fontSize: 16 }}>
                OpenSans-ExtraBoldItalic
              </BodyText>
            </View>
          </View>
        </Section>
        {Platform.OS !== 'web' && <VectorIconSection />}

        {Platform.OS !== 'web' && (
          <Section title="renderToImageAsync" gap={5}>
            {renderedFontAsImage && (
              <>
                <BodyText>
                  Inter-BoldItalic rendered to image
                  {round(renderedFontAsImage.width)}x{round(renderedFontAsImage.height)}
                </BodyText>
                <Image
                  source={{ uri: renderedFontAsImage.uri }}
                  style={{
                    height: renderedFontAsImage.height,
                    width: renderedFontAsImage.width,
                    backgroundColor: 'grey',
                  }}
                  contentFit="cover"
                />
              </>
            )}
            {renderedFontAsImageLineHeight100 && (
              <>
                <BodyText>
                  Inter-BoldItalic rendered to image line-heigth: 100{' '}
                  {round(renderedFontAsImageLineHeight100.width)}x
                  {round(renderedFontAsImageLineHeight100.height)}
                </BodyText>
                <Image
                  source={{ uri: renderedFontAsImageLineHeight100.uri }}
                  style={{
                    height: renderedFontAsImageLineHeight100.height,
                    width: renderedFontAsImageLineHeight100.width,
                    backgroundColor: 'grey',
                  }}
                  contentFit="cover"
                />
                <BodyText>Image above should look the same as &lt;Text&gt;</BodyText>
                <BodyText
                  style={{
                    fontFamily: 'Inter-BoldItalic',
                    fontSize: 100,
                    lineHeight: 100,
                    backgroundColor: 'grey',
                  }}>
                  ÅBÇD
                </BodyText>
              </>
            )}
            {renderedFontAsImageLineHeight150 && (
              <>
                <BodyText>
                  Inter-BoldItalic rendered to image line-heigth: 150{' '}
                  {round(renderedFontAsImageLineHeight150.width)}x
                  {round(renderedFontAsImageLineHeight150.height)}
                </BodyText>
                <Image
                  source={{ uri: renderedFontAsImageLineHeight150.uri }}
                  style={{
                    height: renderedFontAsImageLineHeight150.height,
                    width: renderedFontAsImageLineHeight150.width,
                    backgroundColor: 'grey',
                  }}
                  contentFit="cover"
                />
                <BodyText>Image above should look the same as &lt;Text&gt;</BodyText>
                <BodyText
                  style={{
                    fontFamily: 'Inter-BoldItalic',
                    fontSize: 100,
                    lineHeight: 150,
                    backgroundColor: 'grey',
                  }}>
                  ÅBÇD
                </BodyText>
              </>
            )}
          </Section>
        )}

        <VariableFontSection />
        <MultiFaceFamilySection />
      </Page>
    </ScrollView>
  );
}

// One file, loaded under one name, carrying a `wght` axis with a named instance per weight and a
// `slnt` axis giving each of them an italic. `fontWeight` and `fontStyle` pick between them — with
// a static font every row below would look identical.
const VARIABLE_FONT_FAMILY = 'RobotoFlex-variable';
const WEIGHTS = ['100', '200', '300', '400', '500', '600', '700', '800', '900'] as const;

// RobotoFlex-variable loads at app startup, before any screen renders, so no loaded/error gate is needed here.
const WEIGHT_INSTANCING_GROUPS: FaceMetricsGroup[] = [
  {
    title: 'Weight instancing — Roboto Flex',
    rows: [
      {
        key: 'weight400',
        label: 'weight 400',
        style: { fontFamily: VARIABLE_FONT_FAMILY, fontWeight: '400' },
        role: 'baseline',
      },
      {
        key: 'weight100',
        label: 'weight 100',
        style: { fontFamily: VARIABLE_FONT_FAMILY, fontWeight: '100' },
        role: 'measured',
        baseKey: 'weight400',
        // Roboto Flex's `wght` 100 instance is only 1.2–1.6% narrower than 400; a non-instanced
        // fallback renders at 0.0%.
        thresholdPercent: 0.6,
      },
      {
        key: 'weight900',
        label: 'weight 900',
        style: { fontFamily: VARIABLE_FONT_FAMILY, fontWeight: '900' },
        role: 'measured',
        baseKey: 'weight400',
      },
    ],
  },
];

const WEIGHT_INSTANCING_CAPTION =
  'a real `wght` instance changes the advance width; without instancing every weight renders at ' +
  "the file's default and the widths match.";

function VariableFontSection() {
  return (
    <Section title="variable fonts" gap={5}>
      <BodyText>
        Roboto Flex, loaded at runtime once under the name &quot;{VARIABLE_FONT_FAMILY}&quot;. Both
        columns should get steadily heavier, and the right one should slant — one file backing all
        of it.
      </BodyText>
      <View style={styles.variableFontRow}>
        <View style={styles.variableFontColumn}>
          {WEIGHTS.map((weight) => (
            <BodyText
              key={weight}
              style={{ fontFamily: VARIABLE_FONT_FAMILY, fontWeight: weight, fontSize: 20 }}>
              {weight} Hamburg
            </BodyText>
          ))}
        </View>
        <View style={styles.variableFontColumn}>
          {WEIGHTS.map((weight) => (
            <BodyText
              key={weight}
              style={{
                fontFamily: VARIABLE_FONT_FAMILY,
                fontWeight: weight,
                fontStyle: 'italic',
                fontSize: 20,
              }}>
              {weight} Hamburg
            </BodyText>
          ))}
        </View>
      </View>
      <FaceMetricsTable groups={WEIGHT_INSTANCING_GROUPS} caption={WEIGHT_INSTANCING_CAPTION} />
    </Section>
  );
}

function MultiFaceFamilySection() {
  const [loaded, error] = useFonts([
    {
      fontFamily: 'Inter-multiface',
      fontDefinitions: [
        { path: require('../../assets/fonts/Inter/Inter-Regular.otf'), weight: 400 },
        { path: require('../../assets/fonts/Inter/Inter-Medium.otf'), weight: 500 },
        { path: require('../../assets/fonts/Inter/Inter-Bold.otf'), weight: 700 },
        {
          path: require('../../assets/fonts/Inter/Inter-Italic.otf'),
          weight: 400,
          style: 'italic',
        },
        {
          path: require('../../assets/fonts/Inter/Inter-BoldItalic.otf'),
          weight: 700,
          style: 'italic',
        },
      ],
    },
    {
      fontFamily: 'Inter-singleface',
      fontDefinitions: [
        { path: require('../../assets/fonts/Inter/Inter-Regular.otf'), weight: 400 },
      ],
    },
    {
      fontFamily: 'MetricsProbe',
      fontDefinitions: [
        {
          path: require('../../assets/fonts/OpenSans/OpenSans_Condensed-SemiBold.ttf'),
          weight: 400,
        },
        {
          path: require('../../assets/fonts/OpenSans/OpenSans_Condensed-BoldItalic.ttf'),
          weight: 400,
          style: 'italic',
        },
      ],
    },
    // One variable file declared as two faces of a family. Only Android keeps the `wght` axis of
    // a family's face; iOS and web read one weight per file, so this family and its check are
    // Android-only.
    ...(Platform.OS === 'android'
      ? [
          {
            fontFamily: 'RobotoFlex-multiface',
            fontDefinitions: [
              { path: require('../../assets/fonts/RobotoFlex.ttf') },
              { path: require('../../assets/fonts/RobotoFlex.ttf'), style: 'italic' as const },
            ],
          },
        ]
      : []),
  ]);

  return (
    <Section title="multi-face font family" gap={5}>
      <BodyText>
        Five files, loaded at runtime under one name, &quot;Inter-multiface&quot;. The `fontWeight`
        and `fontStyle` style props pick the matching face.
      </BodyText>
      {error && <BodyText style={{ color: 'red' }}>{error.message}</BodyText>}
      {!loaded && !error && <BodyText>loading fonts…</BodyText>}
      {loaded && (
        <View style={styles.variableFontRow}>
          <View style={styles.variableFontColumn}>
            <BodyText style={{ fontFamily: 'Inter-multiface', fontWeight: '400', fontSize: 20 }}>
              400 Hamburg
            </BodyText>
            <BodyText style={{ fontFamily: 'Inter-multiface', fontWeight: '500', fontSize: 20 }}>
              500 Hamburg
            </BodyText>
            <BodyText style={{ fontFamily: 'Inter-multiface', fontWeight: '700', fontSize: 20 }}>
              700 Hamburg
            </BodyText>
          </View>
          <View style={styles.variableFontColumn}>
            <BodyText
              style={{
                fontFamily: 'Inter-multiface',
                fontWeight: '400',
                fontStyle: 'italic',
                fontSize: 20,
              }}>
              400 Hamburg
            </BodyText>
            <BodyText
              style={{
                fontFamily: 'Inter-multiface',
                fontWeight: '700',
                fontStyle: 'italic',
                fontSize: 20,
              }}>
              700 Hamburg
            </BodyText>
          </View>
        </View>
      )}
      {loaded && (
        <FaceMetricsTable groups={MULTIFACE_METRICS_GROUPS} caption={MULTIFACE_METRICS_CAPTION} />
      )}
    </Section>
  );
}

// A real face changes the rendered width of the sample; a synthesized bold or italic keeps it.
// Inter's italic shares its upright's advance widths, so the italic check uses an OpenSans
// Condensed pair instead, whose italic differs by ~2.6%.
const FACE_METRICS_SAMPLE = 'Hamburgefonstiv 1234';
const FACE_METRICS_FONT_SIZE = 30;
const REAL_FACE_THRESHOLD_PERCENT = 1.5;

type FaceMetricsRow = {
  key: string;
  label: string;
  style: TextStyle;
  role: 'baseline' | 'measured' | 'na';
  baseKey?: string;
  control?: boolean;
  note?: string;
  // Overrides REAL_FACE_THRESHOLD_PERCENT for faces whose real width difference is small.
  thresholdPercent?: number;
};

type FaceMetricsGroup = {
  title: string;
  rows: FaceMetricsRow[];
};

const NOT_WIDTH_CHECKABLE_NOTE = 'width check n/a (metrics-compatible italic)';

const MULTIFACE_METRICS_GROUPS: FaceMetricsGroup[] = [
  {
    title: 'Bold check — Inter',
    rows: [
      {
        key: 'regular',
        label: 'regular',
        style: { fontFamily: 'Inter-multiface', fontWeight: '400' },
        role: 'baseline',
      },
      {
        key: 'bold',
        label: 'bold',
        style: { fontFamily: 'Inter-multiface', fontWeight: '700' },
        role: 'measured',
        baseKey: 'regular',
      },
      {
        key: 'italic',
        label: 'italic',
        style: { fontFamily: 'Inter-multiface', fontWeight: '400', fontStyle: 'italic' },
        role: 'na',
        note: NOT_WIDTH_CHECKABLE_NOTE,
      },
      {
        key: 'boldItalic',
        label: 'bold italic',
        style: { fontFamily: 'Inter-multiface', fontWeight: '700', fontStyle: 'italic' },
        role: 'na',
        note: NOT_WIDTH_CHECKABLE_NOTE,
      },
      {
        key: 'syntheticBold',
        label: 'synthetic bold control',
        style: { fontFamily: 'Inter-singleface', fontWeight: '700' },
        role: 'measured',
        baseKey: 'regular',
        control: true,
      },
    ],
  },
  {
    title: 'Italic check — OpenSans Condensed probe',
    rows: [
      {
        key: 'probeUpright',
        label: 'italic probe upright',
        style: { fontFamily: 'MetricsProbe', fontWeight: '400' },
        role: 'baseline',
      },
      {
        key: 'probeItalic',
        label: 'italic probe italic',
        style: { fontFamily: 'MetricsProbe', fontWeight: '400', fontStyle: 'italic' },
        role: 'measured',
        baseKey: 'probeUpright',
      },
    ],
  },
  ...(Platform.OS === 'android'
    ? [
        {
          title: 'Variable family instancing — Roboto Flex',
          rows: [
            {
              key: 'variableFamily400',
              label: 'weight 400',
              style: { fontFamily: 'RobotoFlex-multiface', fontWeight: '400' },
              role: 'baseline',
            },
            {
              key: 'variableFamily900',
              label: 'weight 900',
              style: { fontFamily: 'RobotoFlex-multiface', fontWeight: '900' },
              role: 'measured',
              baseKey: 'variableFamily400',
            },
          ],
        } satisfies FaceMetricsGroup,
      ]
    : []),
];

const MULTIFACE_METRICS_CAPTION =
  'Bold is proven with Inter — a real bold file changes the advance width, and a synthetic-bold ' +
  'control (a regular-only family forced to fontWeight 700) confirms that a merely synthesized ' +
  'weight does not.';

const PASS_COLOR = '#1b7f37';
const FAIL_COLOR = '#c62828';
const MUTED_COLOR = '#8a8a8a';

function FaceMetricsTable({ groups, caption }: { groups: FaceMetricsGroup[]; caption?: string }) {
  const { theme } = useTheme();
  const textColor = theme.text.default;
  const [widths, setWidths] = useState<Record<string, number>>({});

  const allRows: FaceMetricsRow[] = [];
  const seenKeys = new Set<string>();
  for (const group of groups) {
    for (const row of group.rows) {
      if (!seenKeys.has(row.key)) {
        seenKeys.add(row.key);
        allRows.push(row);
      }
    }
  }

  // onLayout, not onTextLayout: on Android, onTextLayout's lines[].width reports the same value
  // for every face; the view frame of a self-sizing Text reflects the real measurement.
  const handleLayout = (key: string, event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    if (!width) {
      return;
    }
    setWidths((prev) => (prev[key] === width ? prev : { ...prev, [key]: width }));
  };

  const diffPercent = (width: number, base: number) => ((width - base) / base) * 100;

  const rowDiff = (row: FaceMetricsRow): number | undefined => {
    const width = widths[row.key];
    const base = row.baseKey ? widths[row.baseKey] : undefined;
    if (width == null || base == null) {
      return undefined;
    }
    return diffPercent(width, base);
  };

  const allMeasured = allRows.every((row) => widths[row.key] != null);
  let verdictLine: string | null = null;
  let verdictPassed = false;
  if (allMeasured) {
    const failed: string[] = [];
    for (const row of allRows) {
      if (row.role !== 'measured') {
        continue;
      }
      const diff = rowDiff(row);
      if (diff == null) {
        continue;
      }
      // Magnitude, not signed: a real face can be narrower (the italic probe is).
      const differs = Math.abs(diff) > (row.thresholdPercent ?? REAL_FACE_THRESHOLD_PERCENT);
      const passed = row.control ? !differs : differs;
      if (!passed) {
        failed.push(row.label);
      }
    }
    verdictPassed = failed.length === 0;
    verdictLine = verdictPassed
      ? '✓ verified: real faces selected'
      : `✗ NOT verified: failed ${failed.join(', ')}`;
  }

  const renderCheckRow = (row: FaceMetricsRow) => {
    const width = widths[row.key];
    const diff = rowDiff(row);

    let widthText = '…';
    let diffText = '—';
    let markText = '…';
    let markColor = MUTED_COLOR;

    if (width != null) {
      widthText = width.toFixed(1);
    }
    if (row.role === 'na') {
      markText = row.note ?? '';
    } else if (width != null) {
      if (row.role === 'baseline') {
        markText = 'base';
      } else if (diff != null) {
        const sign = diff >= 0 ? '+' : '';
        diffText = `${sign}${diff.toFixed(1)}%`;
        const differs = Math.abs(diff) > (row.thresholdPercent ?? REAL_FACE_THRESHOLD_PERCENT);
        if (row.control) {
          markText = differs ? '✗ real file?!' : '✓ synthetic, as expected';
          markColor = differs ? FAIL_COLOR : PASS_COLOR;
        } else {
          markText = differs ? '✓ real file' : '✗ approximation';
          markColor = differs ? PASS_COLOR : FAIL_COLOR;
        }
      }
    }

    return (
      <View key={row.key} style={styles.checkRow}>
        <BodyText style={[styles.checkLabel, { color: textColor }]}>{row.label}</BodyText>
        <BodyText style={[styles.checkWidth, { color: textColor }]}>{widthText}</BodyText>
        <BodyText style={[styles.checkDiff, { color: textColor }]}>{diffText}</BodyText>
        <BodyText style={[styles.checkMark, { color: markColor }]}>{markText}</BodyText>
      </View>
    );
  };

  const verdictColor = verdictLine == null ? MUTED_COLOR : verdictPassed ? PASS_COLOR : FAIL_COLOR;

  return (
    <View style={{ gap: 5 }}>
      <BodyText>Same string, same font size, measured per face via `onLayout`.</BodyText>
      <ScrollView horizontal>
        <View>
          {allRows.map((row) => (
            <Text
              key={row.key}
              numberOfLines={1}
              onLayout={(event) => handleLayout(row.key, event)}
              style={[
                row.style,
                { fontSize: FACE_METRICS_FONT_SIZE, alignSelf: 'flex-start', color: textColor },
              ]}>
              {FACE_METRICS_SAMPLE}
            </Text>
          ))}
        </View>
      </ScrollView>
      <View style={styles.metricsSummary}>
        {groups.map((group) => (
          <View key={group.title} style={{ gap: 2 }}>
            <BodyText style={[styles.groupTitle, { color: textColor }]}>{group.title}</BodyText>
            <View style={styles.checkRow}>
              <Text style={[styles.checkLabel, styles.headerCell]}>face</Text>
              <Text style={[styles.checkWidth, styles.headerCell]}>width</Text>
              <Text style={[styles.checkDiff, styles.headerCell]}>Δ width</Text>
              <Text style={[styles.checkMark, styles.headerCell]}>result</Text>
            </View>
            {group.rows.map((row) => renderCheckRow(row))}
          </View>
        ))}
        <BodyText style={styles.caption}>
          width: rendered width of the sample string, in points. Δ width: difference against the
          group&apos;s `base` row — a real face changes it, a synthesized one doesn&apos;t.
        </BodyText>
        {caption && <BodyText style={styles.caption}>{caption}</BodyText>}
        <BodyText style={[styles.verdictText, { color: verdictColor }]}>
          {verdictLine ?? 'measuring…'}
        </BodyText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  variableFontRow: { flexDirection: 'row', columnGap: 12 },
  variableFontColumn: { flex: 1 },
  vectorIconsContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    flex: 1,
  },
  vectorIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
  },
  vectorIconsName: {
    margin: 15,
    fontSize: 22,
  },
  customFonts: {
    padding: 15,
    flex: 1,
    gap: 4,
    flexDirection: 'row',
  },
  metricsSummary: {
    gap: 8,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    columnGap: 8,
  },
  checkLabel: {
    flex: 1,
    fontSize: 13,
  },
  checkWidth: {
    width: 56,
    textAlign: 'right',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 13,
  },
  checkDiff: {
    width: 64,
    textAlign: 'right',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 13,
  },
  checkMark: {
    flex: 1.4,
    fontSize: 13,
  },
  groupTitle: {
    fontWeight: '700',
    fontSize: 14,
  },
  headerCell: {
    color: '#8a8a8a',
    fontSize: 11,
  },
  caption: {
    fontSize: 12,
    color: '#8a8a8a',
  },
  verdictText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

const size = 100;

function useLoadIcon(getImage: () => Promise<RenderToImageResult | null>) {
  const [icon, setIcon] = useState<RenderToImageResult | null>(null);
  useEffect(() => {
    if (Platform.OS === 'web') {
      // result not used on web
      return;
    }
    const loadIcon = async () => {
      const icon = await getImage();
      if (icon) {
        setIcon(icon);
      } else {
        console.error('Failed to load icon');
      }
    };
    loadIcon();
  }, []);
  return icon;
}

function VectorIconSection() {
  const icons = [
    useLoadIcon(() => MaterialCommunityIcons.getImageSource('camera', size, 'yellow')),
    useLoadIcon(() => Ionicons.getImageSource('camera', size, 'yellow')),
  ];

  return (
    <Section title="vector icon to image">
      <BodyText>rendered in expo-image and RN-core Image</BodyText>
      <BodyText>
        To get the pixel size of an image, multiply `renderedImage.dimension * scale`
      </BodyText>

      {icons.map((icon) => {
        return (
          !!icon && (
            <Fragment key={icon.uri}>
              <BodyText>
                Icon rendered to image {round(icon.width)}x{round(icon.height)}, scale: {icon.scale}
              </BodyText>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <Image
                  source={icon}
                  style={{
                    height: icon.height,
                    width: icon.width,
                    backgroundColor: 'lightgrey',
                  }}
                />
                <CoreImage
                  source={icon}
                  style={{
                    backgroundColor: 'lightgrey',
                  }}
                />
              </View>
            </Fragment>
          )
        );
      })}
    </Section>
  );
}
