import {
  Button as SwiftUIButton,
  Host,
  HStack,
  SynchronousList,
  Text as SwiftUIText,
  VStack,
} from '@expo/ui/swift-ui';
import {
  background,
  buttonStyle,
  cornerRadius,
  font,
  foregroundStyle,
  frame,
  padding,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import * as React from 'react';
import { Button, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function Row({ index }: { index: number }) {
  const [state, setState] = React.useState({
    index,
    presses: 0,
    expanded: false,
  });
  // Reset during render so a reused row commits with fresh state for its new index.
  if (state.index !== index) {
    setState({ index, presses: 0, expanded: false });
  }
  const accent = index % 2 === 0 ? '#4475E5' : '#9570D6';
  return (
    <View testID={`sync-row-${index}`} style={{ paddingVertical: 10 }}>
      <Host matchContents={{ vertical: true }}>
        <VStack
          alignment="leading"
          spacing={14}
          modifiers={[frame({ maxWidth: Infinity, alignment: 'leading' })]}>
          <HStack spacing={12}>
            <SwiftUIText
              modifiers={[
                font({ size: 17, weight: 'bold' }),
                foregroundStyle('#FFFFFF'),
                frame({ width: 44, height: 44 }),
                background(accent),
                cornerRadius(14),
              ]}>
              {String(index + 1).padStart(2, '0')}
            </SwiftUIText>
            <VStack alignment="leading" spacing={3}>
              <SwiftUIText modifiers={[font({ size: 17, weight: 'semibold' })]}>
                {index % 2 === 0 ? 'Weekend field notes' : 'Ideas worth keeping'}
              </SwiftUIText>
              <SwiftUIText
                modifiers={[
                  font({ size: 12 }),
                  foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
                ]}>
                Entry {index + 1} · {2 + (index % 5)} min read
              </SwiftUIText>
            </VStack>
          </HStack>
          <SwiftUIText modifiers={[font({ size: 15 })]}>
            {'A quiet morning, a new trail, and a little time to notice the details. '.repeat(
              1 + (index % 3)
            )}
          </SwiftUIText>
          {state.expanded && (
            <VStack
              alignment="leading"
              spacing={8}
              modifiers={[padding({ all: 12 }), background(`${accent}18`), cornerRadius(12)]}>
              <SwiftUIText modifiers={[font({ size: 14, weight: 'semibold' })]}>
                A little more from this entry
              </SwiftUIText>
              <SwiftUIText modifiers={[font({ size: 14 })]}>
                {'Take the slower route. Write down one thing you want to remember. '.repeat(
                  2 + (index % 4)
                )}
              </SwiftUIText>
            </VStack>
          )}
          <HStack spacing={12}>
            <SwiftUIButton
              label={state.expanded ? 'Show less' : 'Read more'}
              systemImage={state.expanded ? 'chevron.up' : 'chevron.down'}
              modifiers={[buttonStyle('bordered'), tint(accent)]}
              onPress={() =>
                setState((current) => ({
                  ...current,
                  expanded: !current.expanded,
                }))
              }
            />
            <SwiftUIButton
              label={`Like · ${state.presses}`}
              systemImage={state.presses > 0 ? 'heart.fill' : 'heart'}
              modifiers={[buttonStyle('borderless'), tint(accent)]}
              onPress={() =>
                setState((current) => ({
                  ...current,
                  presses: current.presses + 1,
                }))
              }
            />
          </HStack>
        </VStack>
      </Host>
    </View>
  );
}

export default function SynchronousListScreen() {
  const [count, setCount] = React.useState(10000);
  const [visible, setVisible] = React.useState(true);

  const data = React.useMemo(() => Array.from({ length: count }, (_, index) => index), [count]);
  const renderItem = React.useCallback(({ item }: { item: number }) => <Row index={item} />, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Text style={{ padding: 12 }}>
        {count.toLocaleString()} SwiftUI rows. Tap Read more to test height changes. Likes and
        expansion reset when a row is recycled.
      </Text>
      <Button
        title={visible ? 'Unmount list' : 'Mount list'}
        onPress={() => setVisible((v) => !v)}
      />
      <Button
        title="Toggle 100 / 10,000 rows"
        onPress={() => setCount((n) => (n === 100 ? 10000 : 100))}
      />
      {visible && (
        <Host style={{ flex: 1 }} ignoreSafeArea="all">
          <SynchronousList data={data} renderItem={renderItem} />
        </Host>
      )}
    </SafeAreaView>
  );
}

SynchronousListScreen.navigationOptions = { title: 'Synchronous List' };
