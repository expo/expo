import { Box, Column, Host, Row, Shape, Text as ComposeText } from '@expo/ui/jetpack-compose';
import {
  background,
  fillMaxHeight,
  fillMaxSize,
  linearGradient,
  matchParentSize,
  recordLayer,
  size,
} from '@expo/ui/jetpack-compose/modifiers';
import React from 'react';
import { ScrollView, StyleSheet, Text as RNText, View } from 'react-native';

// Each `<Box hostsLayer={...}>` owns one Compose GraphicsLayer. Descendants
// record into it via the `recordLayer()` modifier; after the box's children
// render, the layer is composited on top using the configured `blendMode`.
// Box automatically applies offscreen compositing when blendMode is anything
// other than `'srcOver'`, so the user doesn't need to add a graphicsLayer
// modifier for that.
export default function MaskScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Section title="Text mask with colored stripes">
        <Host matchContents>
          <Box hostsLayer={{ blendMode: 'dstIn' }} modifiers={[size(320, 80)]}>
            <Row modifiers={[size(320, 80)]}>
              <Box modifiers={[fillMaxHeight(), size(80, 80), background('#3D5A80')]} />
              <Box modifiers={[fillMaxHeight(), size(80, 80), background('#DAA520')]} />
              <Box modifiers={[fillMaxHeight(), size(80, 80), background('#E07A5F')]} />
              <Box modifiers={[fillMaxHeight(), size(80, 80), background('#D5D5D5')]} />
            </Row>
            <Box contentAlignment="center" modifiers={[matchParentSize(), recordLayer()]}>
              <ComposeText style={{ fontSize: 52, fontWeight: 'bold' }}>Basic Mask</ComposeText>
            </Box>
          </Box>
        </Host>
      </Section>

      <Section title="Gradient text">
        <Host matchContents>
          <Box
            hostsLayer={{ blendMode: 'dstIn' }}
            modifiers={[
              size(300, 80),
              background(
                linearGradient({
                  colors: ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#AF52DE'],
                  startPoint: { x: 0, y: 0 },
                  endPoint: { x: 1, y: 1 },
                })
              ),
            ]}>
            <Box contentAlignment="center" modifiers={[matchParentSize(), recordLayer()]}>
              <ComposeText style={{ fontSize: 64, fontWeight: 'bold' }}>EXPO</ComposeText>
            </Box>
          </Box>
        </Host>
      </Section>

      <Section title="Circle mask over red/blue split">
        <Host matchContents>
          <Box hostsLayer={{ blendMode: 'dstIn' }} modifiers={[size(200, 200)]}>
            <Row modifiers={[size(200, 200)]}>
              <Box modifiers={[size(100, 200), background('#FF3B30')]} />
              <Box modifiers={[size(100, 200), background('#007AFF')]} />
            </Row>
            <Box contentAlignment="center" modifiers={[matchParentSize(), recordLayer()]}>
              <Shape.Circle modifiers={[size(140, 140)]} color="#000000" />
            </Box>
          </Box>
        </Host>
      </Section>

      <Section title="Rounded rectangle mask with gradient">
        <Host matchContents>
          <Box
            hostsLayer={{ blendMode: 'dstIn' }}
            modifiers={[
              size(260, 120),
              background(
                linearGradient({
                  colors: ['#FF2D55', '#AF52DE'],
                  startPoint: { x: 0, y: 0 },
                  endPoint: { x: 1, y: 1 },
                })
              ),
            ]}>
            <Box contentAlignment="center" modifiers={[matchParentSize(), recordLayer()]}>
              <Shape.RoundedCorner
                modifiers={[size(240, 100)]}
                color="#000000"
                cornerRadii={{ topStart: 24, topEnd: 24, bottomStart: 24, bottomEnd: 24 }}
              />
            </Box>
          </Box>
        </Host>
      </Section>

      <Section title="alignment='topStart'">
        <Host matchContents>
          <Box
            hostsLayer={{ blendMode: 'dstIn' }}
            modifiers={[
              size(260, 120),
              background(
                linearGradient({
                  colors: ['#34C759', '#007AFF'],
                  startPoint: { x: 0, y: 0 },
                  endPoint: { x: 1, y: 1 },
                })
              ),
            ]}>
            <Box contentAlignment="topStart" modifiers={[matchParentSize(), recordLayer()]}>
              <ComposeText style={{ fontSize: 28, fontWeight: 'bold' }}>TOP START</ComposeText>
            </Box>
          </Box>
        </Host>
      </Section>

      <Section title="Stacked mask content">
        <Host matchContents>
          <Box
            hostsLayer={{ blendMode: 'dstIn' }}
            modifiers={[
              size(280, 140),
              background(
                linearGradient({
                  colors: ['#FF9500', '#FF3B30'],
                  startPoint: { x: 0, y: 0 },
                  endPoint: { x: 1, y: 1 },
                })
              ),
            ]}>
            <Box contentAlignment="center" modifiers={[matchParentSize(), recordLayer()]}>
              <Column>
                <ComposeText style={{ fontSize: 40, fontWeight: 'bold' }}>HELLO</ComposeText>
                <ComposeText style={{ fontSize: 40, fontWeight: 'bold' }}>WORLD</ComposeText>
              </Column>
            </Box>
          </Box>
        </Host>
      </Section>

      <Section title="alignment='bottomEnd'">
        <Host matchContents>
          <Box
            hostsLayer={{ blendMode: 'dstIn' }}
            modifiers={[size(260, 120), background('#FF9500')]}>
            <Box contentAlignment="bottomEnd" modifiers={[matchParentSize(), recordLayer()]}>
              <ComposeText style={{ fontSize: 28, fontWeight: 'bold' }}>BOTTOM END</ComposeText>
            </Box>
          </Box>
        </Host>
      </Section>

      <Section title="Gradient alpha fade (horizontal)">
        <Host matchContents>
          <Box hostsLayer={{ blendMode: 'dstIn' }} modifiers={[size(300, 80)]}>
            <Row modifiers={[size(300, 80)]}>
              <Box modifiers={[size(60, 80), background('#3D5A80')]} />
              <Box modifiers={[size(60, 80), background('#DAA520')]} />
              <Box modifiers={[size(60, 80), background('#E07A5F')]} />
              <Box modifiers={[size(60, 80), background('#34C759')]} />
              <Box modifiers={[size(60, 80), background('#007AFF')]} />
            </Row>
            <Box
              modifiers={[
                matchParentSize(),
                recordLayer(),
                background(
                  linearGradient({
                    colors: ['#000000', '#00000000'],
                    startPoint: { x: 0, y: 0 },
                    endPoint: { x: 1, y: 0 },
                  })
                ),
              ]}
            />
          </Box>
        </Host>
      </Section>

      <Section title="Gradient alpha fade (vertical)">
        <Host matchContents>
          <Box
            hostsLayer={{ blendMode: 'dstIn' }}
            modifiers={[
              size(200, 200),
              background(
                linearGradient({
                  colors: ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#AF52DE'],
                  startPoint: { x: 0, y: 0 },
                  endPoint: { x: 1, y: 1 },
                })
              ),
            ]}>
            <Box
              modifiers={[
                matchParentSize(),
                recordLayer(),
                background(
                  linearGradient({
                    colors: ['#000000', '#000000', '#00000000'],
                    startPoint: { x: 0, y: 0 },
                    endPoint: { x: 0, y: 1 },
                  })
                ),
              ]}
            />
          </Box>
        </Host>
      </Section>

      <Section title="Inverse mask (dstOut) — circle punches a hole">
        <Host matchContents>
          <Box
            hostsLayer={{ blendMode: 'dstOut' }}
            modifiers={[size(200, 200), background('#FF3B30')]}>
            <Box contentAlignment="center" modifiers={[matchParentSize(), recordLayer()]}>
              <Shape.Circle modifiers={[size(120, 120)]} color="#000000" />
            </Box>
          </Box>
        </Host>
      </Section>

      <Section title="Nested non-host container — recordLayer still finds the host's layer">
        <Host matchContents>
          <Box hostsLayer={{ blendMode: 'dstIn' }} modifiers={[size(200, 200), background('#007AFF')]}>
            {/* Intermediate Row that doesn't host. recordLayer still picks up
                the host's layer through the scope. Use fillMaxSize so the inner
                Box's bounds match the host's so the layer covers the full
                background; matchParentSize is BoxScope-only. */}
            <Row modifiers={[matchParentSize()]}>
              <Box contentAlignment="center" modifiers={[fillMaxSize(), recordLayer()]}>
                <Shape.Circle modifiers={[size(140, 140)]} color="#000000" />
              </Box>
            </Row>
          </Box>
        </Host>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <RNText style={styles.sectionTitle}>{title}</RNText>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 24,
    alignItems: 'center',
  },
  section: {
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#636366',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionBody: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7C7CC',
    borderStyle: 'dashed',
    padding: 4,
  },
});

MaskScreen.navigationOptions = {
  title: 'Mask (hostsLayer)',
};
