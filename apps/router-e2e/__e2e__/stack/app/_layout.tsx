import { Stack } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

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
            <Stack.Header.Left asChild>
              <View style={{ padding: 10 }}>
                <Text style={{ color: 'purple' }}>Custom Left</Text>
              </View>
            </Stack.Header.Left>
            <Stack.Header.Right asChild>
              <Text style={{ color: 'orange', marginRight: 10 }}>Custom Right</Text>
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
