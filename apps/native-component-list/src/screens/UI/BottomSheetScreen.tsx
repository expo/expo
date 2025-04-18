import { BottomSheet } from '@expo/ui/swift-ui/BottomSheet';
import { Button } from '@expo/ui/swift-ui/Button';
import * as React from 'react';
import { ScrollView, Text } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
export default function SectionScreen() {
  const [isOpened, setIsOpened] = React.useState<boolean>(true);
  const [height, setHeight] = React.useState<number>(100);

  return (
    <ScrollView>
      <Button onPress={() => setIsOpened((h) => !h)}>Toggle</Button>
      <Text>isOpened: {isOpened ? 'yes' : 'no'}</Text>
      <BottomSheet isOpened={isOpened} onIsOpenedChange={(e) => setIsOpened(e)}>
        <Animated.View layout={LinearTransition.duration(3000)} style={{ height, padding: 20 }}>
          <Button onPress={() => setHeight((h) => (h > 500 ? 100 : h + 100))}>
            Increase height
          </Button>
        </Animated.View>
      </BottomSheet>
    </ScrollView>
  );
}

SectionScreen.navigationOptions = {
  title: 'Section',
};
