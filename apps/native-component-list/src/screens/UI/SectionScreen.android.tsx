import * as React from 'react';
import { ScrollView, Text, View } from 'react-native';

export default function SectionScreen() {
  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ textAlign: 'center' }}>Not implemented yet on Android</Text>
      </View>
    </ScrollView>
  );
}

SectionScreen.navigationOptions = {
  title: 'Section',
};
