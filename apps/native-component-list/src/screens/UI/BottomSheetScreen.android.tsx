import { Button, BottomSheet, Host, RNHostView } from '@expo/ui/jetpack-compose';
import * as React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

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
      <Host matchContents>
        <Button onPress={() => setIsOpened((h) => !h)}>Toggle</Button>
      </Host>

      <Text>isOpened: {isOpened ? 'yes' : 'no'}</Text>
      {isOpened && (
        <Host matchContents>
          <BottomSheet onDismissRequest={() => setIsOpened(false)}>
            <RNHostView matchContents>
              <View style={{ width: 100, height: 100, backgroundColor: 'red' }}>
                <Pressable
                  style={{ width: 100, height: 100, backgroundColor: 'blue' }}
                  onPress={() => {
                    console.log('pressed');
                    setIsOpened(false);
                  }}>
                  <Text>Close</Text>
                </Pressable>
              </View>
            </RNHostView>
          </BottomSheet>
        </Host>
      )}
    </ScrollView>
  );
}

BottomSheetScreen.navigationOptions = {
  title: 'BottomSheet',
};
