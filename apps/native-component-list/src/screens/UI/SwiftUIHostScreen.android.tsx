import * as React from 'react';
import { ScrollView, Text, View } from 'react-native';

export default function SwiftUIHostScreen() {
  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ textAlign: 'center' }}>
          Not implemented on Android, as you might expect.
        </Text>
      </View>
    </ScrollView>
  );
}

SwiftUIHostScreen.navigationOptions = {
  title: 'SwiftUI Host',
};
