import { Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function Screen() {
  return (
    <>
      <Stack.Header style={{ backgroundColor: 'transparent' }} />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="sf:checkmark"
          onPress={() => console.log('Checkmark pressed')}
        />
      </Stack.Toolbar>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button icon="sf:xmark" onPress={() => console.log('Xmark pressed')} />
      </Stack.Toolbar>
      <View style={{ flex: 1, justifyContent: 'space-between', alignItems: 'center' }}>
        <Text>Form Sheet Modal Content - Start</Text>
        <Text>Form Sheet Modal Content - End</Text>
      </View>
    </>
  );
}
