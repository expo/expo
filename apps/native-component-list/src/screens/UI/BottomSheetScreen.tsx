import { BottomSheet } from '@expo/ui/components/BottomSheet';
import { Button } from '@expo/ui/components/Button';
import * as React from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
export default function SectionScreen() {
  const [isOpened, setIsOpened] = React.useState<boolean>(true);
  const [height, setHeight] = React.useState<number>(100);

  return (
    <ScrollView>
      <Button onPress={() => setIsOpened((h) => !h)}>Toggle</Button>
      <Text>isOpened: {isOpened ? 'yes' : 'no'}</Text>
      <BottomSheet isOpened={isOpened} onIsOpenedChange={(e) => setIsOpened(e)}>
        <View
          style={{
            backgroundColor: 'green',
            flex: 1,
            margin: 10,
            // alignSelf: 'stretch',
          }}>
          <Button onPress={() => setHeight((h) => (h > 500 ? 100 : h + 100))}>
            Increase height
          </Button>
        </View>
      </BottomSheet>
      <Text>isOpened: {isOpened ? 'yes' : 'no'}</Text>
    </ScrollView>
  );
}

SectionScreen.navigationOptions = {
  title: 'Section',
};
