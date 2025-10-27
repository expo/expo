import { Host, List, Text, Section } from '@expo/ui/swift-ui';
import { font } from '@expo/ui/swift-ui/modifiers';
import * as React from 'react';

export default function TextScreen() {
  const textNumber = 123;

  return (
    <Host style={{ flex: 1 }}>
      <List>
        <Section title="Default">
          <Text>Hello world</Text>
        </Section>
        <Section title="Text number">
          <Text>{textNumber}</Text>
        </Section>
        <Section title="Interpolated string">
          <Text>
            {/* eslint-disable-next-line */}
            Hello {'world'} {123}
          </Text>
        </Section>

        <Section title="Custom Font Families">
          <Text modifiers={[font({ family: 'Inter-Bold', size: 18 })]}>Inter Bold Font</Text>
          <Text modifiers={[font({ family: 'Inter-Medium', size: 16 })]}>Inter Medium Font</Text>
          <Text modifiers={[font({ family: 'Inter-Light', size: 14 })]}>Inter Light Font</Text>
          <Text modifiers={[font({ family: 'Inter-Regular', size: 15 })]}>Inter Regular Font</Text>
        </Section>

        <Section title="System Font Weights">
          <Text modifiers={[font({ weight: 'ultraLight', size: 16 })]}>Ultra Light Weight</Text>
          <Text modifiers={[font({ weight: 'thin', size: 16 })]}>Thin Weight</Text>
          <Text modifiers={[font({ weight: 'light', size: 16 })]}>Light Weight</Text>
          <Text modifiers={[font({ weight: 'regular', size: 16 })]}>Regular Weight</Text>
          <Text modifiers={[font({ weight: 'medium', size: 16 })]}>Medium Weight</Text>
          <Text modifiers={[font({ weight: 'semibold', size: 16 })]}>Semibold Weight</Text>
          <Text modifiers={[font({ weight: 'bold', size: 16 })]}>Bold Weight</Text>
          <Text modifiers={[font({ weight: 'heavy', size: 16 })]}>Heavy Weight</Text>
          <Text modifiers={[font({ weight: 'black', size: 16 })]}>Black Weight</Text>
        </Section>

        <Section title="System Font Designs">
          <Text modifiers={[font({ design: 'default', weight: 'medium', size: 16 })]}>
            Default Design
          </Text>
          <Text modifiers={[font({ design: 'rounded', weight: 'medium', size: 16 })]}>
            Rounded Design
          </Text>
          <Text modifiers={[font({ design: 'serif', weight: 'medium', size: 16 })]}>
            Serif Design
          </Text>
          <Text modifiers={[font({ design: 'monospaced', weight: 'medium', size: 16 })]}>
            Monospaced Design
          </Text>
        </Section>

        <Section title="Font Sizes">
          <Text modifiers={[font({ size: 12, weight: 'regular' })]}>12pt Font Size</Text>
          <Text modifiers={[font({ size: 14, weight: 'regular' })]}>14pt Font Size</Text>
          <Text modifiers={[font({ size: 16, weight: 'regular' })]}>16pt Font Size</Text>
          <Text modifiers={[font({ size: 18, weight: 'regular' })]}>18pt Font Size</Text>
          <Text modifiers={[font({ size: 20, weight: 'regular' })]}>20pt Font Size</Text>
          <Text modifiers={[font({ size: 24, weight: 'regular' })]}>24pt Font Size</Text>
        </Section>

        <Section title="Combined Examples">
          <Text modifiers={[font({ family: 'Inter-ExtraBold', size: 20 })]}>
            Custom Font: Inter Extra Bold 20pt
          </Text>
          <Text modifiers={[font({ weight: 'bold', design: 'rounded', size: 18 })]}>
            System Font: Bold Rounded 18pt
          </Text>
          <Text modifiers={[font({ weight: 'light', design: 'serif', size: 16 })]}>
            System Font: Light Serif 16pt
          </Text>
          <Text modifiers={[font({ weight: 'heavy', design: 'monospaced', size: 14 })]}>
            System Font: Heavy Monospaced 14pt
          </Text>
        </Section>
      </List>
    </Host>
  );
}

TextScreen.navigationOptions = {
  title: 'Text',
};
