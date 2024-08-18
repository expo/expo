import 'server-only';

import { ActionButton } from '../lib/action-button';
import { AI } from '../lib/ai-actions';
import { SafeAreaView, Image, Text, View } from '../lib/react-native';
import { SomeButton } from '../lib/somebutton';

export default function Page() {
  return (
    <AI>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, gap: 8, alignItems: 'center', justifyContent: 'center' }}>
          <Text testID="main-text">Hey RSC</Text>
          {/* local Metro asset */}
          <Image
            testID="main-image"
            source={require('../../../assets/icon.png')}
            style={{ width: 100, height: 100 }}
          />

          <SomeButton
            title="Button"
            onPress={async () => {
              'use server';
              console.log('Button pressed');
            }}
          />
          <ActionButton title="Button" />
        </View>
      </SafeAreaView>
    </AI>
  );
}
