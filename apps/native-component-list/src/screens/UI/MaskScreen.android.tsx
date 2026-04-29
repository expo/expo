import { Box, Column, Host, Mask, Row, Text as ComposeText } from '@expo/ui/jetpack-compose';
import { background, clip, fillMaxHeight, Shapes, size } from '@expo/ui/jetpack-compose/modifiers';
import React from 'react';
import { ScrollView, StyleSheet, Text as RNText, View } from 'react-native';

export default function MaskScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Section title="Text mask with colored stripes">
        <Host matchContents>
          <Mask>
            <Row modifiers={[size(320, 80)]}>
              <Box modifiers={[fillMaxHeight(), size(80, 80), background('#3D5A80')]} />
              <Box modifiers={[fillMaxHeight(), size(80, 80), background('#DAA520')]} />
              <Box modifiers={[fillMaxHeight(), size(80, 80), background('#E07A5F')]} />
              <Box modifiers={[fillMaxHeight(), size(80, 80), background('#D5D5D5')]} />
            </Row>
            <Mask.Content>
              <ComposeText style={{ fontSize: 52, fontWeight: 'bold' }}>Basic Mask</ComposeText>
            </Mask.Content>
          </Mask>
        </Host>
      </Section>

      <Section title="Gradient text">
        <Host matchContents>
          <Mask>
            <Box
              modifiers={[
                size(300, 80),
                background({
                  colors: ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#AF52DE'],
                  startPoint: { x: 0, y: 0 },
                  endPoint: { x: 1, y: 1 },
                }),
              ]}
            />
            <Mask.Content>
              <ComposeText style={{ fontSize: 64, fontWeight: 'bold' }}>EXPO</ComposeText>
            </Mask.Content>
          </Mask>
        </Host>
      </Section>

      <Section title="Circle mask over red/blue split (140dp circle, 200dp content)">
        <Host matchContents>
          <Mask>
            <Row modifiers={[size(200, 200)]}>
              <Box modifiers={[size(100, 200), background('#FF3B30')]} />
              <Box modifiers={[size(100, 200), background('#007AFF')]} />
            </Row>
            <Mask.Content>
              <Box modifiers={[size(140, 140), clip(Shapes.Circle), background('#000000')]} />
            </Mask.Content>
          </Mask>
        </Host>
      </Section>

      <Section title="Rounded rectangle mask with gradient">
        <Host matchContents>
          <Mask>
            <Box
              modifiers={[
                size(260, 120),
                background({
                  colors: ['#FF2D55', '#AF52DE'],
                  startPoint: { x: 0, y: 0 },
                  endPoint: { x: 1, y: 1 },
                }),
              ]}
            />
            <Mask.Content>
              <Box
                modifiers={[size(240, 100), clip(Shapes.RoundedCorner(24)), background('#000000')]}
              />
            </Mask.Content>
          </Mask>
        </Host>
      </Section>

      <Section title="alignment='topStart'">
        <Host matchContents>
          <Mask alignment="topStart">
            <Box
              modifiers={[
                size(260, 120),
                background({
                  colors: ['#34C759', '#007AFF'],
                  startPoint: { x: 0, y: 0 },
                  endPoint: { x: 1, y: 1 },
                }),
              ]}
            />
            <Mask.Content>
              <ComposeText style={{ fontSize: 28, fontWeight: 'bold' }}>TOP START</ComposeText>
            </Mask.Content>
          </Mask>
        </Host>
      </Section>

      <Section title="Stacked mask content">
        <Host matchContents>
          <Mask>
            <Box
              modifiers={[
                size(280, 140),
                background({
                  colors: ['#FF9500', '#FF3B30'],
                  startPoint: { x: 0, y: 0 },
                  endPoint: { x: 1, y: 1 },
                }),
              ]}
            />
            <Mask.Content>
              <Column>
                <ComposeText style={{ fontSize: 40, fontWeight: 'bold' }}>HELLO</ComposeText>
                <ComposeText style={{ fontSize: 40, fontWeight: 'bold' }}>WORLD</ComposeText>
              </Column>
            </Mask.Content>
          </Mask>
        </Host>
      </Section>

      <Section title="alignment='bottomEnd'">
        <Host matchContents>
          <Mask alignment="bottomEnd">
            <Box modifiers={[size(260, 120), background('#FF9500')]} />
            <Mask.Content>
              <ComposeText style={{ fontSize: 28, fontWeight: 'bold' }}>BOTTOM END</ComposeText>
            </Mask.Content>
          </Mask>
        </Host>
      </Section>

      <Section title="Gradient alpha fade (horizontal)">
        <Host matchContents>
          <Mask>
            <Row modifiers={[size(300, 80)]}>
              <Box modifiers={[size(60, 80), background('#3D5A80')]} />
              <Box modifiers={[size(60, 80), background('#DAA520')]} />
              <Box modifiers={[size(60, 80), background('#E07A5F')]} />
              <Box modifiers={[size(60, 80), background('#34C759')]} />
              <Box modifiers={[size(60, 80), background('#007AFF')]} />
            </Row>
            <Mask.Content>
              <Box
                modifiers={[
                  size(300, 80),
                  background({
                    colors: ['#000000', '#00000000'],
                    startPoint: { x: 0, y: 0 },
                    endPoint: { x: 1, y: 0 },
                  }),
                ]}
              />
            </Mask.Content>
          </Mask>
        </Host>
      </Section>

      <Section title="Gradient alpha fade (vertical)">
        <Host matchContents>
          <Mask>
            <Box
              modifiers={[
                size(200, 200),
                background({
                  colors: ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#AF52DE'],
                  startPoint: { x: 0, y: 0 },
                  endPoint: { x: 1, y: 1 },
                }),
              ]}
            />
            <Mask.Content>
              <Box
                modifiers={[
                  size(200, 200),
                  background({
                    colors: ['#000000', '#000000', '#00000000'],
                    startPoint: { x: 0, y: 0 },
                    endPoint: { x: 0, y: 1 },
                  }),
                ]}
              />
            </Mask.Content>
          </Mask>
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
  title: 'Mask',
};
