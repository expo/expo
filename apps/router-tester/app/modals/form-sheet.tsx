import { Stack } from 'expo-router';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Screen() {
  return (
    <>
      <Stack.Header style={{ backgroundColor: 'transparent' }} />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="checkmark" onPress={() => console.log('Checkmark pressed')} />
      </Stack.Toolbar>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button icon="xmark" onPress={() => console.log('Xmark pressed')} />
      </Stack.Toolbar>
      <SafeAreaView
        edges={['left', 'right']}
        style={{ flex: 1, justifyContent: 'space-between', alignItems: 'center' }}>
        <Text>Form Sheet Modal Content - Start</Text>
        <Text>Form Sheet Modal Content - End</Text>
      </SafeAreaView>
    </>
  );
}
