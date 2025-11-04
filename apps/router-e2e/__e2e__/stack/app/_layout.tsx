import { Icon, Label, Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { IsProtectedContext } from '../utils/contexts';

export default function Layout() {
  const [isProtected, setIsProtected] = useState(true);
  return (
    <IsProtectedContext value={[isProtected, setIsProtected]}>
      <Stack
        screenOptions={({ route: { params } }) => ({
          title: (params as { id?: string } | undefined)?.id,
        })}>
        <Stack.Header>
          <Stack.Header.BackButton src={require('../../../assets/explore_orange.png')}>
            &lt;Go back&lt;
          </Stack.Header.BackButton>
        </Stack.Header>
        <Stack.Screen name="index">
          <Stack.Header
            style={{ backgroundColor: 'transparent' }}
            largeStyle={{ backgroundColor: 'transparent', shadowColor: 'transparent' }}>
            <Stack.Header.Title
              style={{ fontSize: 12, color: 'blue' }}
              largeStyle={{ color: '#F00' }}
              large>
              Custom Header Title
            </Stack.Header.Title>
            <Stack.Header.Left>
              <Stack.Header.Button
                style={{ color: 'green' }}
                icon="arrow.left.circle"
                onPress={() => alert('Left button pressed!')}
              />
              <Stack.Header.Button style={{ color: 'green' }} onPress={() => alert('2 pressed!')}>
                <Label>2</Label>
                <Icon sf="star.fill" />
              </Stack.Header.Button>
            </Stack.Header.Left>
            <Stack.Header.Right>
              <Stack.Header.Menu>
                <Stack.Header.Label>Menu</Stack.Header.Label>
                <Stack.Header.Icon sf="ellipsis.circle" />
                <Stack.Header.MenuAction onPress={() => Alert.alert('Action 1 pressed!')}>
                  Action 1
                </Stack.Header.MenuAction>
                <Stack.Header.MenuAction
                  isOn
                  icon="star.fill"
                  onPress={() => Alert.alert('Action 2 pressed!')}>
                  Action 2
                </Stack.Header.MenuAction>
              </Stack.Header.Menu>
              <Stack.Header.Button
                style={{ color: 'green', backgroundColor: 'transparent' }}
                separateBackground
                icon="arrow.right.circle"
                onPress={() => alert('Left button pressed!')}>
                Right
              </Stack.Header.Button>
            </Stack.Header.Right>
          </Stack.Header>
        </Stack.Screen>
        <Stack.Screen name="modal" options={{ presentation: 'pageSheet' }}>
          <Stack.Header asChild>
            <View
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'gray',
                height: 300,
              }}>
              <Text style={{ fontSize: 18, color: '#fff' }}>Modal Header</Text>
            </View>
          </Stack.Header>
        </Stack.Screen>
        <Stack.Protected guard={!isProtected}>
          <Stack.Screen name="protected" />
        </Stack.Protected>
        <Stack.Screen name="[id]" />
      </Stack>
    </IsProtectedContext>
  );
}
