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
        <Stack.Screen name="index">
          <Stack.Header
            style={{ backgroundColor: 'transparent' }}
            largeStyle={{ backgroundColor: 'transparent', shadowColor: 'transparent' }}
          />
          <Stack.Screen.Title
            style={{ fontSize: 12, color: 'blue' }}
            largeStyle={{ color: '#F00' }}
            large>
            Custom Header Title
          </Stack.Screen.Title>
          <Stack.Toolbar placement="left">
            <Stack.Toolbar.Button
              style={{ color: 'green' }}
              icon="sf:arrow.left.circle"
              onPress={() => alert('Left button pressed!')}
            />
            <Stack.Toolbar.Button style={{ color: 'green' }} onPress={() => alert('2 pressed!')}>
              <Label>2</Label>
              <Icon sf="star.fill" />
            </Stack.Toolbar.Button>
          </Stack.Toolbar>
          <Stack.Toolbar placement="right">
            <Stack.Toolbar.Menu>
              <Stack.Toolbar.Label>Menu</Stack.Toolbar.Label>
              <Stack.Toolbar.Icon sf="ellipsis.circle" />
              <Stack.Toolbar.MenuAction onPress={() => Alert.alert('Action 1 pressed!')}>
                Action 1
              </Stack.Toolbar.MenuAction>
              <Stack.Toolbar.MenuAction
                isOn
                icon="sf:star.fill"
                onPress={() => Alert.alert('Action 2 pressed!')}>
                Action 2
              </Stack.Toolbar.MenuAction>
            </Stack.Toolbar.Menu>
            <Stack.Toolbar.Button
              style={{ color: 'green', backgroundColor: 'transparent' }}
              separateBackground
              icon="sf:arrow.right.circle"
              onPress={() => alert('Left button pressed!')}>
              Right
            </Stack.Toolbar.Button>
          </Stack.Toolbar>
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
        <Stack.Screen name="[id]">
          <Stack.Screen.BackButton src={require('../../../assets/explore_orange.png')}>
            &lt;Go back&lt;
          </Stack.Screen.BackButton>
        </Stack.Screen>
      </Stack>
    </IsProtectedContext>
  );
}
