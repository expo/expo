import { Button, BottomSheet } from '@expo/ui/jetpack-compose';
import * as React from 'react';
import { ScrollView, Text, View } from 'react-native';

export default function BottomSheetScreen() {
  const [isOpened, setIsOpened] = React.useState<boolean>(false);

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
        <View style={{ padding: 20 }}>
          <Text>Hello world</Text>
        </View>
      </BottomSheet>
    </ScrollView>
  );
}

BottomSheetScreen.navigationOptions = {
  title: 'BottomSheet',
};
