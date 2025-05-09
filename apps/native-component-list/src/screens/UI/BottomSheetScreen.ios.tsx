import { Button, BottomSheet } from '@expo/ui/swift-ui';
import * as React from 'react';
import { ScrollView, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export default function BottomSheetScreen() {
  const [isOpened, setIsOpened] = React.useState<boolean>(true);
  const height = useSharedValue(100);

  const handleIncreaseHeight = () => {
    height.value = height.value > 500 ? 100 : height.value + 100;
  };

  const animatedStyles = useAnimatedStyle(() => ({
    height: withTiming(height.value, { duration: 3000 }),
  }));

  return (
    <ScrollView
      contentContainerStyle={{
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        padding: 8,
      }}>
      <Button onPress={() => setIsOpened((h) => !h)}>Toggle</Button>
      <Text>isOpened: {isOpened ? 'yes' : 'no'}</Text>
      <BottomSheet isOpened={isOpened} onIsOpenedChange={(e) => setIsOpened(e)}>
        <Animated.View style={[{ padding: 20 }, animatedStyles]}>
          <Button onPress={handleIncreaseHeight}>Increase height</Button>
        </Animated.View>
      </BottomSheet>
    </ScrollView>
  );
}

BottomSheetScreen.navigationOptions = {
  title: 'BottomSheet',
};
