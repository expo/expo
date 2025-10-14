import { Sidebar, useGlobalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { PlatformColor, Pressable, ScrollView, Text } from 'react-native';
// import { Screen, ScreenStack, ScreenStackItem } from 'react-native-screens';
import { SafeAreaView } from 'react-native-screens/experimental';

function usePasswords({ type }: { type: string | undefined }) {
  const passwords = useMemo(
    () =>
      Array.from({ length: type === 'all' ? 20 : 10 }, (_, i) => ({
        id: `${i}`,
        name: `Item ${i}`,
      })),
    [type]
  );
  return passwords;
}

export default function Layout() {
  console.log('Rendering [type] layout');
  const { type, id } = useGlobalSearchParams();
  const passwords = usePasswords({ type: type as string });
  const router = useRouter();
  return (
    <Sidebar>
      {/* <ScreenStack style={{ flex: 1 }}>
        <ScreenStackItem
          screenId="1123"
          style={{ flex: 1 }}
          headerConfig={{
            title: String(type),
            largeTitle: true,
            largeTitleBackgroundColor: 'transparent',
            translucent: true,
            blurEffect: 'systemChromeMaterial',
          }}> */}
      <SafeAreaView style={{ flex: 1 }} edges={{ left: true }}>
        <ScrollView style={{ flex: 1 }} contentInsetAdjustmentBehavior="automatic">
          {passwords.map((item) => (
            <Sidebar.Trigger href={`/${type}/${item.id}`} key={item.id}>
              <Pressable
                key={item.id}
                onPress={() => {
                  router.push(`/${type}/${item.id}`);
                }}
                style={{
                  padding: 16,
                  backgroundColor: item.id === id ? PlatformColor('systemBlue') : undefined,
                }}>
                <Text
                  style={{
                    fontSize: 16,
                    color: item.id === id ? '#fff' : undefined,
                  }}>
                  {item.name}
                </Text>
              </Pressable>
            </Sidebar.Trigger>
          ))}
        </ScrollView>
      </SafeAreaView>
      {/* </ScreenStackItem>
      </ScreenStack> */}
    </Sidebar>
  );
}
