import {
  Background,
  Form,
  Host,
  Image,
  Rectangle,
  RoundedRectangle,
  Section,
  Text,
  VStack,
} from '@expo/ui/swift-ui';
import { bold, font, foregroundStyle, frame, padding } from '@expo/ui/swift-ui/modifiers';

export default function BackgroundScreen() {
  return (
    <Host style={{ flex: 1 }}>
      <Form>
        <Section title="Shape behind a card">
          <Background>
            <VStack modifiers={[frame({ maxWidth: Infinity }), padding()]}>
              <Text modifiers={[foregroundStyle('blue'), bold()]}>Expo UI Components</Text>
              <Text modifiers={[font({ textStyle: 'footnote' }), foregroundStyle('#8E8E93')]}>
                Build native UIs with SwiftUI
              </Text>
            </VStack>

            <Background.Content>
              <RoundedRectangle cornerRadius={12} modifiers={[foregroundStyle('#F2F2F7')]} />
            </Background.Content>
          </Background>
        </Section>

        <Section title="Aligned to the bottom edge">
          <Background alignment="bottom">
            <Text modifiers={[padding({ bottom: 6 })]}>Underlined by its background</Text>

            <Background.Content>
              <Rectangle modifiers={[frame({ height: 3 }), foregroundStyle('#007AFF')]} />
            </Background.Content>
          </Background>
        </Section>

        <Section title="Image behind text">
          <Background>
            <Text modifiers={[font({ textStyle: 'headline' }), padding({ all: 24 })]}>
              Sparkles
            </Text>

            <Background.Content>
              <Image
                systemName="sparkles"
                modifiers={[font({ size: 64 }), foregroundStyle('#FF9500')]}
              />
            </Background.Content>
          </Background>
        </Section>
      </Form>
    </Host>
  );
}

BackgroundScreen.navigationOptions = {
  title: 'Background',
};
