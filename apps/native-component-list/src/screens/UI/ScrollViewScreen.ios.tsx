import { HStack, Host, ScrollView, VStack, Text, RoundedRectangle } from '@expo/ui/swift-ui';
import {
  frame,
  foregroundStyle,
  padding,
  font,
  scrollIndicators,
} from '@expo/ui/swift-ui/modifiers';

import { ScrollPage, Section } from '../../components/Page';

function VerticalExample() {
  return (
    <Host style={{ height: 240 }}>
      <ScrollView>
        <VStack spacing={12}>
          {Array.from({ length: 20 }, (_, i) => (
            <RoundedRectangle
              key={i}
              cornerRadius={12}
              modifiers={[
                frame({ height: 60, maxWidth: 10000 }),
                foregroundStyle(`hsl(${i * 18}, 70%, 50%)`),
                padding({ horizontal: 16 }),
              ]}
            />
          ))}
        </VStack>
      </ScrollView>
    </Host>
  );
}

function HorizontalExample() {
  return (
    <Host style={{ height: 120 }}>
      <ScrollView axes="horizontal">
        <HStack spacing={8}>
          {Array.from({ length: 20 }, (_, i) => (
            <RoundedRectangle
              key={i}
              cornerRadius={12}
              modifiers={[
                frame({ width: 100, height: 100 }),
                foregroundStyle(`hsl(${i * 18}, 70%, 50%)`),
              ]}
            />
          ))}
        </HStack>
      </ScrollView>
    </Host>
  );
}

function BothAxesExample() {
  const rows = 12;
  const cols = 12;
  return (
    <Host style={{ height: 240 }}>
      <ScrollView axes="both">
        <VStack spacing={8}>
          {Array.from({ length: rows }, (_, r) => (
            <HStack key={r} spacing={8}>
              {Array.from({ length: cols }, (_, c) => (
                <RoundedRectangle
                  key={c}
                  cornerRadius={8}
                  modifiers={[
                    frame({ width: 80, height: 80 }),
                    foregroundStyle(`hsl(${(r * cols + c) * 6}, 70%, 55%)`),
                  ]}
                />
              ))}
            </HStack>
          ))}
        </VStack>
      </ScrollView>
    </Host>
  );
}

function HideIndicatorsExample() {
  return (
    <Host style={{ height: 240 }}>
      <ScrollView modifiers={[scrollIndicators('hidden')]}>
        <VStack spacing={8}>
          {Array.from({ length: 30 }, (_, i) => (
            <Text key={i} modifiers={[font({ size: 17 }), padding({ horizontal: 16 })]}>
              {`Item ${i + 1}`}
            </Text>
          ))}
        </VStack>
      </ScrollView>
    </Host>
  );
}

export default function ScrollViewScreen() {
  return (
    <ScrollPage>
      <Section title="Vertical (default)">
        <VerticalExample />
      </Section>
      <Section title="Horizontal">
        <HorizontalExample />
      </Section>
      <Section title='axes="both" (2D scroll)'>
        <BothAxesExample />
      </Section>
      <Section title='scrollIndicators("hidden") modifier'>
        <HideIndicatorsExample />
      </Section>
    </ScrollPage>
  );
}

ScrollViewScreen.navigationOptions = {
  title: 'ScrollView',
};
