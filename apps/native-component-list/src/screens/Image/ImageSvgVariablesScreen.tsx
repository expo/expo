import { Code } from '@expo/html-elements';
import { Image, ImageProps } from 'expo-image';
import React, { PropsWithChildren, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import MonoText from '../../components/MonoText';
import { Colors } from '../../constants';

type SvgVariables = NonNullable<ImageProps['svgVariables']>;

type Example = {
  description: string;
  svgVariables?: SvgVariables;
  // Extra images rendered next to the first one, each with its own variables.
  alsoWith?: SvgVariables[];
  tintColor?: string;
  source?: ImageProps['source'];
  cachePolicy?: ImageProps['cachePolicy'];
};

// Declares --roof, --wall, --door, --window, --frame, --frame-width, --sun and --sun-opacity.
// Every property except --sun-opacity has a fallback.
const HOUSE = require('../../../assets/images/house.svg');

// Declares --angle, --progress, --track-width, --track-opacity, --needle-width, --hub-radius,
// --corner-radius, --frame-width, --tick-width (in a <style> block) and --marker (display).
const GAUGE = require('../../../assets/images/gauge.svg');

// The Expo logo, with --color, --stroke and --stroke-width. Its <defs> hold a fixed rainbow gradient
// and a two-stop gradient whose stops are --gradient-from and --gradient-to, so a color variable can
// point at either with url(#id). Other screens render it without the prop, which exercises the
// fallback resolution on the normal load path.
const EXPO_LOGO = require('../../../assets/images/expo.svg');

const RASTER = require('../../../assets/images/expo-icon.png');

const LOGO_VARIANTS: { label: string; svgVariables?: SvgVariables }[] = [
  { label: 'no prop' },
  { label: "'--color': '#ee3333'", svgVariables: { '--color': '#ee3333' } },
  { label: "'--color': '#000000'", svgVariables: { '--color': '#000000' } },
  {
    label: 'outline',
    svgVariables: { '--color': 'none', '--stroke': '#4843E3', '--stroke-width': 1 },
  },
  {
    label: 'fill + stroke',
    svgVariables: { '--color': '#fff3b0', '--stroke': '#1b3a66', '--stroke-width': 0.75 },
  },
  {
    label: "'--color': 'url(#rainbow)'",
    svgVariables: { '--color': 'url(#rainbow)' },
  },
  {
    label: 'gradient with variable stops',
    svgVariables: {
      '--color': 'url(#gradient)',
      '--gradient-from': '#ff9500',
      '--gradient-to': '#af52de',
    },
  },
  {
    label: 'rainbow stroke',
    svgVariables: { '--color': 'none', '--stroke': 'url(#rainbow)', '--stroke-width': 1.5 },
  },
];

const HOUSE_EXAMPLES: Example[] = [
  {
    description:
      'svgVariables={undefined}\nWithout the prop the document renders with its fallbacks, like in a browser.',
  },
  {
    description: 'svgVariables={{}}\nAn empty object gives the same result as no prop.',
    svgVariables: {},
  },
  {
    description: "{ '--roof': '#ee3333' }\nOne value set, the rest fall back.",
    svgVariables: { '--roof': '#ee3333' },
  },
  {
    description: 'All colors set',
    svgVariables: {
      '--roof': '#ee3333',
      '--wall': '#3399ff',
      '--door': '#ffffff',
      '--window': '#fff3b0',
      '--frame': '#1b3a66',
      '--sun': '#ff8800',
    },
  },
  {
    description: "Color functions and keywords: rgb(), hsl(), 'rebeccapurple'",
    svgVariables: {
      '--roof': 'rgb(40, 120, 60)',
      '--wall': 'hsl(40, 80%, 85%)',
      '--door': 'rebeccapurple',
    },
  },
  {
    description: "'transparent' and 'none' hide parts of the drawing",
    svgVariables: { '--roof': 'transparent', '--door': 'none', '--wall': '#a0e0a0' },
  },
  {
    description: "Numbers are accepted: { '--frame-width': 4, '--sun-opacity': 0.3 }",
    svgVariables: { '--frame-width': 4, '--sun-opacity': 0.3, '--window': '#ffffff' },
  },
  {
    description: 'Unknown variable names are ignored',
    svgVariables: { '--does-not-exist': 'red', '--wall': '#a0e0a0' },
  },
  {
    description: 'A value with markup characters is escaped, not injected',
    svgVariables: {
      '--roof': '"/><rect width="100" height="100" fill="red"/><g fill="',
      '--wall': '#3399ff',
    },
  },
  {
    description:
      'Together with tintColor="red"\nThe tint paints every opaque pixel red, so color values cannot show. Alpha and geometry still do: the wall is transparent, the window frames are thicker and the sun is translucent.',
    svgVariables: {
      '--wall': 'transparent',
      '--frame-width': 4,
      '--sun-opacity': 0.3,
    },
    tintColor: 'red',
  },
  {
    description: 'Raster source with svgVariables: no effect',
    svgVariables: { '--roof': '#3399ff' },
    source: RASTER,
  },
];

const GAUGE_EXAMPLES: Example[] = [
  {
    description: 'svgVariables={undefined}\nFallbacks only.',
  },
  {
    description: "Needle angle in a transform: { '--angle': -120 }, 0 and 120",
    svgVariables: { '--angle': -120 },
    alsoWith: [{ '--angle': 0 }, { '--angle': 120 }],
  },
  {
    description: "Progress arc length in stroke-dasharray: { '--progress': 130 }",
    svgVariables: { '--progress': 130, '--angle': 100 },
  },
  {
    description: "Stroke widths: { '--track-width': 12, '--needle-width': 5, '--tick-width': 3 }",
    svgVariables: { '--track-width': 12, '--needle-width': 5, '--tick-width': 3 },
  },
  {
    description: "Radii: { '--corner-radius': 45, '--hub-radius': 9 }",
    svgVariables: { '--corner-radius': 45, '--hub-radius': 9 },
  },
  {
    description: "Opacity: { '--track-opacity': 0.25 }",
    svgVariables: { '--track-opacity': 0.25 },
  },
  {
    description: "Toggling a hidden part via a <style> display rule: { '--marker': 'inline' }",
    svgVariables: { '--marker': 'inline' },
  },
  {
    description: "Percentages and units: { '--frame-width': '4%' , '--hub-radius': '10%' }",
    svgVariables: { '--frame-width': '4%', '--hub-radius': '10%' },
  },
];

/**
 * Public SVGs that refer to CSS custom properties. The renderers on either platform can't resolve
 * `var()` themselves, so the "as published" column shows what these look like without the prop.
 */
const NETWORK_EXAMPLES: {
  name: string;
  source: string;
  variants: { label: string; svgVariables: SvgVariables }[];
}[] = [
  {
    name: 'square-flags (kapowaz): palette variables with fallbacks',
    source: 'https://raw.githubusercontent.com/kapowaz/square-flags/main/flags/de.svg',
    variants: [
      {
        label: 'grayscale palette',
        svgVariables: {
          '--flag-palette-black': '#222222',
          '--flag-palette-bright-red': '#777777',
          '--flag-palette-yellow': '#dddddd',
        },
      },
      {
        label: 'one color swapped',
        svgVariables: { '--flag-palette-yellow': '#3399ff' },
      },
    ],
  },
  {
    name: 'square-flags (kapowaz): another flag, same palette variables',
    source: 'https://raw.githubusercontent.com/kapowaz/square-flags/main/flags/jp.svg',
    variants: [
      {
        label: 'inverted',
        svgVariables: { '--flag-palette-white': '#d80027', '--flag-palette-bright-red': '#ffffff' },
      },
      {
        label: 'brand colors',
        svgVariables: { '--flag-palette-white': '#1b3a66', '--flag-palette-bright-red': '#ffcc33' },
      },
    ],
  },
  {
    name: 'CUTracer logo (Meta): a single --accent declared in :root, no fallbacks',
    source: 'https://raw.githubusercontent.com/facebookexperimental/CUTracer/main/logo.svg',
    variants: [
      { label: "'--accent': '#ee3333'", svgVariables: { '--accent': '#ee3333' } },
      { label: "'--accent': '#3399ff'", svgVariables: { '--accent': '#3399ff' } },
    ],
  },
  {
    name: 'patronum logo (effector): Docusaurus theme variables with fallbacks',
    source: 'https://raw.githubusercontent.com/effector/patronum/main/logo.svg',
    variants: [
      {
        label: 'dark theme',
        svgVariables: { '--ifm-paper-background': '#1b1b1d', '--ifm-paper-foreground': '#ffffff' },
      },
    ],
  },
];

const CELL_SIZE = 96;

const ROOF_COLORS = ['#ee3333', '#3399ff', '#22aa55', '#888888'];
const ANGLES = [-120, -60, 0, 60, 120];

type EventCounts = { loadStart: number; load: number; error: number; lastError?: string };

function useEventCounts(): [EventCounts, Pick<ImageProps, 'onLoadStart' | 'onLoad' | 'onError'>] {
  const [counts, setCounts] = useState<EventCounts>({ loadStart: 0, load: 0, error: 0 });
  const handlers = {
    onLoadStart() {
      setCounts((current) => ({ ...current, loadStart: current.loadStart + 1 }));
    },
    onLoad() {
      setCounts((current) => ({ ...current, load: current.load + 1 }));
    },
    onError(event: { error: string }) {
      setCounts((current) => ({ ...current, error: current.error + 1, lastError: event.error }));
    },
  };
  return [counts, handlers];
}

function EventCountsExample() {
  const [svgCounts, svgHandlers] = useEventCounts();
  const [rasterCounts, rasterHandlers] = useEventCounts();
  const [brokenCounts, brokenHandlers] = useEventCounts();
  const [angle, setAngle] = useState(0);

  return (
    <View style={styles.example}>
      <MonoText>
        Events. Each image should report exactly one onLoadStart per load and then either onLoad or
        onError. Changing a variable is a new load.
      </MonoText>
      <View style={styles.cellGroup}>
        <Cell label={formatCounts('SVG', svgCounts)}>
          <Image
            style={styles.cellImage}
            source={GAUGE}
            contentFit="contain"
            svgVariables={{ '--angle': angle }}
            {...svgHandlers}
          />
        </Cell>
        <Cell label={formatCounts('PNG', rasterCounts)}>
          <Image
            style={styles.cellImage}
            source={RASTER}
            contentFit="contain"
            svgVariables={{ '--angle': angle }}
            {...rasterHandlers}
          />
        </Cell>
        <Cell label={formatCounts('404', brokenCounts)}>
          <Image
            style={styles.cellImage}
            source="https://raw.githubusercontent.com/expo/expo/main/does-not-exist.svg"
            contentFit="contain"
            svgVariables={{ '--angle': angle }}
            {...brokenHandlers}
          />
        </Cell>
      </View>
      <Button title={`Change angle (${angle})`} onPress={() => setAngle((angle + 60) % 180)} />
    </View>
  );
}

function formatCounts(label: string, counts: EventCounts) {
  const base = `${label}: start ${counts.loadStart}, load ${counts.load}, error ${counts.error}`;
  return counts.lastError ? `${base}\n${counts.lastError}` : base;
}

export default function ImageSvgVariablesScreen() {
  const [roofIndex, setRoofIndex] = useState(0);
  const [angleIndex, setAngleIndex] = useState(2);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Expo logo (local asset shared with other screens)</Text>
      <View style={styles.example}>
        <MonoText>
          expo.svg uses var() for its fill and stroke. Other screens render it without the prop.
        </MonoText>
        <View style={styles.cellGroup}>
          {LOGO_VARIANTS.map((variant) => (
            <Cell key={variant.label} label={variant.label}>
              <Image
                style={styles.cellImage}
                source={EXPO_LOGO}
                contentFit="contain"
                svgVariables={variant.svgVariables}
              />
            </Cell>
          ))}
        </View>
      </View>

      <Text style={styles.heading}>Multi-color house (local asset)</Text>
      <View style={styles.example}>
        <MonoText>
          Large render: edges should stay crisp because the SVG is not rasterized.
        </MonoText>
        <Image
          style={styles.largeImage}
          source={HOUSE}
          contentFit="contain"
          svgVariables={{ '--roof': ROOF_COLORS[roofIndex], '--wall': '#e8e8e8' }}
        />
        <Button
          title={`Change roof color (${ROOF_COLORS[roofIndex]})`}
          onPress={() => setRoofIndex((roofIndex + 1) % ROOF_COLORS.length)}
        />
      </View>
      {HOUSE_EXAMPLES.map((example, index) => (
        <ExampleRow key={index} example={example} defaultSource={HOUSE} />
      ))}

      <Text style={styles.heading}>Values that are not colors (local asset)</Text>
      <View style={styles.example}>
        <MonoText>The needle angle is substituted into a transform.</MonoText>
        <Image
          style={styles.largeImage}
          source={GAUGE}
          contentFit="contain"
          svgVariables={{
            '--angle': ANGLES[angleIndex],
            '--progress': (ANGLES[angleIndex] + 135) * 0.56,
          }}
        />
        <Button
          title={`Rotate needle (${ANGLES[angleIndex]}°)`}
          onPress={() => setAngleIndex((angleIndex + 1) % ANGLES.length)}
        />
      </View>
      {GAUGE_EXAMPLES.map((example, index) => (
        <ExampleRow key={index} example={example} defaultSource={GAUGE} />
      ))}

      <Text style={styles.heading}>Same source, different variables</Text>
      <View style={styles.example}>
        <MonoText>
          One download shared by all variants. Each variant must show its own colors, whatever the
          cache policy.
        </MonoText>
        <View style={styles.cellGroup}>
          {(['memory-disk', 'memory', 'disk', 'none'] as const).map((cachePolicy, index) => (
            <Cell key={cachePolicy} label={cachePolicy}>
              <Image
                style={styles.cellImage}
                source="https://raw.githubusercontent.com/kapowaz/square-flags/main/flags/jp.svg"
                contentFit="contain"
                cachePolicy={cachePolicy}
                svgVariables={{ '--flag-palette-bright-red': ROOF_COLORS[index] }}
              />
            </Cell>
          ))}
        </View>
      </View>

      <Text style={styles.heading}>Network SVGs that use var()</Text>
      {NETWORK_EXAMPLES.map((example) => (
        <View style={styles.example} key={example.name}>
          <MonoText>{example.name}</MonoText>
          <View style={styles.cellGroup}>
            <Cell label="as published">
              <Image style={styles.cellImage} source={example.source} contentFit="contain" />
            </Cell>
            {example.variants.map((variant) => (
              <Cell key={variant.label} label={variant.label}>
                <Image
                  style={styles.cellImage}
                  source={example.source}
                  contentFit="contain"
                  svgVariables={variant.svgVariables}
                />
              </Cell>
            ))}
          </View>
        </View>
      ))}

      <Text style={styles.heading}>Other props</Text>
      <View style={styles.example}>
        <MonoText>
          blurRadius={8} together with svgVariables. Both images must behave like the same SVG
          without variables would: the substituted colors show, and nothing is served from a stale
          cache entry.
        </MonoText>
        <View style={styles.group}>
          <Image
            style={styles.image}
            source={HOUSE}
            contentFit="contain"
            blurRadius={8}
            svgVariables={{ '--roof': '#ee3333', '--wall': '#3399ff' }}
          />
          <Image
            style={styles.image}
            source={HOUSE}
            contentFit="contain"
            svgVariables={{ '--roof': '#ee3333', '--wall': '#3399ff' }}
          />
        </View>
      </View>
      <View style={styles.example}>
        <MonoText>placeholder (blurhash) with svgVariables on the main source.</MonoText>
        <View style={styles.group}>
          <Image
            style={styles.image}
            source="https://raw.githubusercontent.com/facebookexperimental/CUTracer/main/logo.svg"
            placeholder={{ blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj' }}
            contentFit="contain"
            transition={500}
            svgVariables={{ '--accent': '#ee3333' }}
          />
        </View>
      </View>
      <EventCountsExample />
    </ScrollView>
  );
}

/**
 * A fixed-width column with the image on top and a short caption under it, so that a row of variants
 * wraps evenly no matter how long the captions are.
 */
function Cell({ label, children }: PropsWithChildren<{ label: string }>) {
  return (
    <View style={styles.cell}>
      {children}
      <Code style={styles.caption}>{label}</Code>
    </View>
  );
}

function ExampleRow({
  example,
  defaultSource,
}: {
  example: Example;
  defaultSource: ImageProps['source'];
}) {
  return (
    <View style={styles.example}>
      <MonoText>{example.description}</MonoText>
      <View style={styles.group}>
        <Image
          style={styles.image}
          source={example.source ?? defaultSource}
          contentFit="contain"
          svgVariables={example.svgVariables}
          tintColor={example.tintColor}
          cachePolicy={example.cachePolicy}
        />
        {example.alsoWith?.map((svgVariables, index) => (
          <Image
            key={index}
            style={styles.image}
            source={example.source ?? defaultSource}
            contentFit="contain"
            svgVariables={svgVariables}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heading: {
    fontWeight: 'bold',
    fontSize: 18,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  example: {
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopColor: Colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  group: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cellGroup: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    rowGap: 8,
  },
  image: {
    width: 120,
    height: 120,
    borderWidth: 1,
    borderColor: Colors.border,
    marginVertical: 10,
  },
  cell: {
    width: CELL_SIZE,
    alignItems: 'center',
    marginVertical: 6,
  },
  cellImage: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  caption: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
  },
  largeImage: {
    width: 300,
    height: 300,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginVertical: 10,
  },
});
