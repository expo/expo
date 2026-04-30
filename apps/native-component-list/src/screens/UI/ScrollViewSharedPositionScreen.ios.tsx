import { Button, Host, ScrollView, Text, VStack, useNativeState } from '@expo/ui/swift-ui';
import { id, padding, scrollPosition, scrollTargetLayout } from '@expo/ui/swift-ui/modifiers';
import { scheduleOnUI } from 'react-native-worklets';

export default function ScrollViewSharedPositionScreen() {
  const activeID = useNativeState<string | null>(null);

  const scrollToID = (target: string) => {
    scheduleOnUI(() => {
      'worklet';
      activeID.value = target;
    });
  };

  return (
    <Host style={{ flex: 1 }}>
      <VStack spacing={12}>
        <ScrollView
          modifiers={[
            scrollPosition(activeID, {
              onChange: (newID) => {
                console.log('[JS thread] leading target:', newID);
              },
            }),
          ]}>
          <VStack modifiers={[scrollTargetLayout()]}>
            {Array.from({ length: 40 }, (_, i) => (
              <Text
                key={`item-${i}`}
                modifiers={[id(`item-${i}`), padding({ horizontal: 16, vertical: 12 })]}>
                {`Item ${i}`}
              </Text>
            ))}
          </VStack>
        </ScrollView>
        <Button label="Scroll to first item" onPress={() => scrollToID('item-0')} />
        <Button label="Scroll to item 20" onPress={() => scrollToID('item-20')} />
        <Button label="Scroll to last item" onPress={() => scrollToID('item-39')} />
      </VStack>
    </Host>
  );
}

ScrollViewSharedPositionScreen.navigationOptions = {
  title: 'ScrollView shared position',
};
