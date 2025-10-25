import { Stack } from 'expo-router';
import { PlatformColor, Text, View } from 'react-native';

const isAllowed = false;

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Test' }}>
        <Stack.Header
          style={{ backgroundColor: 'transparent' }}
          largeStyle={{ backgroundColor: 'transparent', shadowColor: 'transparent' }}>
          <Stack.Header.Title
            style={{ fontSize: 12, color: PlatformColor('systemBlue') }}
            largeStyle={{ color: '#F00' }}
            large>
            Custom Header Title
          </Stack.Header.Title>
        </Stack.Header>
      </Stack.Screen>
      <Stack.Screen name="js-only">
        <Stack.Header
          style={{ backgroundColor: '#f00' }}
          largeStyle={{ backgroundColor: 'transparent' }}>
          <Stack.Header.Title
            style={{ fontSize: 16, color: PlatformColor('systemGreen') }}
            largeStyle={{ fontSize: 32, color: '#00F' }}>
            JS Only Header Title
          </Stack.Header.Title>
          <Stack.Header.BackButton withMenu />
        </Stack.Header>
      </Stack.Screen>
      <Stack.Protected guard={isAllowed}>
        <Stack.Screen name="protected" />
      </Stack.Protected>
      <Stack.Screen
        name="modal"
        options={{
          presentation: 'modal',
          header: () => (
            <View
              style={{
                height: 80,
                justifyContent: 'flex-end',
                alignItems: 'center',
                backgroundColor: PlatformColor('systemGray6'),
              }}>
              <Text style={{ fontSize: 18 }}>Modal 123455 Header</Text>
            </View>
          ),
        }}>
        <Stack.Header asChild>
          <View
            style={{
              height: 80,
              justifyContent: 'flex-end',
              alignItems: 'center',
              backgroundColor: PlatformColor('systemGray6'),
            }}>
            <Text style={{ fontSize: 18 }}>Modal 123455 Header</Text>
          </View>
        </Stack.Header>
      </Stack.Screen>
      <Stack.Screen
        name="fullScreenModal"
        options={{ presentation: 'fullScreenModal', headerShown: true }}>
        <Stack.Header>
          <Stack.Header.Title>Full Screen Modal Header</Stack.Header.Title>
        </Stack.Header>
      </Stack.Screen>
    </Stack>
  );
}
