import { Button, BottomSheet, Host, VStack, HStack, Switch, Text } from '@expo/ui/swift-ui';
import { fixedSize, frame, padding } from '@expo/ui/swift-ui/modifiers';
import * as React from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export default function BottomSheetScreen() {
  const [isOpened, setIsOpened] = React.useState<boolean>(false);
  const [interactiveDismissDisabled, setInteractiveDismissDisabled] =
    React.useState<boolean>(false);
  const [hideDragIndicator, setHideDragIndicator] = React.useState<boolean>(false);

  return (
    <ScrollView>
      <Host matchContents>
        <VStack alignment="leading" modifiers={[padding({ all: 16 })]} spacing={16}>
          <Button onPress={() => setIsOpened(true)}>Open BottomSheet</Button>
          <HStack>
            <Text modifiers={[fixedSize()]}>Disable interactive dismiss</Text>
            <Switch
              value={interactiveDismissDisabled}
              onValueChange={setInteractiveDismissDisabled}
            />
          </HStack>
          <HStack>
            <Text modifiers={[fixedSize()]}>Hide drag indicator</Text>
            <Switch value={hideDragIndicator} onValueChange={setHideDragIndicator} />
          </HStack>
        </VStack>
      </Host>

      <Host style={{ position: 'absolute' }} matchContents>
        <BottomSheet
          isOpened={isOpened}
          onIsOpenedChange={setIsOpened}
          interactiveDismissDisabled={interactiveDismissDisabled}
          presentationDetents={['medium', 'large', 0.2]}
          presentationDragIndicator={hideDragIndicator ? 'hidden' : 'automatic'}>
          <HStack modifiers={[frame({ height: 100 })]}>
            <Button onPress={() => setIsOpened(false)}>Close BottomSheet</Button>
          </HStack>
        </BottomSheet>
      </Host>
      <BottomSheetReanimatedExample />
    </ScrollView>
  );
}

function BottomSheetReanimatedExample() {
  const [isOpened, setIsOpened] = React.useState<boolean>(true);
  const { width } = useWindowDimensions();
  const height = useSharedValue(100);

  const handleIncreaseHeight = () => {
    height.value = height.value > 500 ? 100 : height.value + 100;
  };

  const animatedStyles = useAnimatedStyle(() => ({
    height: withTiming(height.value, { duration: 1000 }),
  }));

  return (
    <View>
      <Host style={{ position: 'absolute', width }}>
        <BottomSheet isOpened={isOpened} onIsOpenedChange={(e) => setIsOpened(e)}>
          <Animated.View style={[{ padding: 20 }, animatedStyles]}>
            <Host matchContents>
              <Button onPress={handleIncreaseHeight}>Increase height</Button>
            </Host>
          </Animated.View>
        </BottomSheet>
      </Host>
    </View>
  );
}

BottomSheetScreen.navigationOptions = {
  title: 'BottomSheet',
};
