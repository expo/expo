import { Button, BottomSheet, Host } from '@expo/ui/jetpack-compose';
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
      <Host>
        <Button onPress={() => setIsOpened((h) => !h)}>Toggle</Button>
      </Host>

      <Text>isOpened: {isOpened ? 'yes' : 'no'}</Text>
      <Host>
        <BottomSheet isOpened={isOpened} onIsOpenedChange={(e) => setIsOpened(e)}>
          <View style={{ padding: 20 }}>
            <Text>Hello world</Text>
          </View>
        </BottomSheet>
      </Host>
    </ScrollView>
  );
}

BottomSheetScreen.navigationOptions = {
  title: 'BottomSheet',
};
