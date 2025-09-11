import * as React from 'react';
import { ScrollView, Text, View } from 'react-native';

export default function ModifiersScreen() {
  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ textAlign: 'center' }}>Not implemented on Android</Text>
      </View>
    </ScrollView>
  );
}

ModifiersScreen.navigationOptions = {
  title: 'Modifiers',
};
