import { Host, ScrollView, VStack, Text, RoundedRectangle } from '@expo/ui/swift-ui';
import { frame, foregroundStyle, padding, font } from '@expo/ui/swift-ui/modifiers';

export default function ScrollViewScreen() {
  return (
    <Host style={{ flex: 1 }}>
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

export function ScrollViewHorizontalScreen() {
  return (
    <Host style={{ flex: 1 }}>
      <ScrollView axes="horizontal">
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
      </ScrollView>
    </Host>
  );
}

export function ScrollViewHideIndicatorsScreen() {
  return (
    <Host style={{ flex: 1 }}>
      <ScrollView showsIndicators={false}>
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

ScrollViewScreen.navigationOptions = {
  title: 'ScrollView',
};
