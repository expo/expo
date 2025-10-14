import { Sidebar, useGlobalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { PlatformColor, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-screens/experimental';

export default function Layout() {
  console.log('Rendering root layout');
  const params = useGlobalSearchParams();
  const router = useRouter();
  return (
    <Sidebar>
      <SafeAreaView
        edges={{ top: true }}
        style={{
          flex: 1,
          flexWrap: 'wrap',
          gap: 8,
          flexDirection: 'row',
          padding: 8,
          backgroundColor: PlatformColor('lightGray'),
        }}>
        {/* <Sidebar.Header>
          <Sidebar.Header.Right>
            <NativeButton style={{ marginRight: 48 }}>...</NativeButton>
          </Sidebar.Header.Right>
        </Sidebar.Header> */}
        <Sidebar.Trigger href="/all">
          <PasscodeCard
            title="All"
            isActive={params.type === 'all'}
            onPress={() => {
              router.replace('/all/');
            }}
          />
        </Sidebar.Trigger>
        <Sidebar.Trigger href="/passkeys">
          <PasscodeCard
            title="Passkeys"
            isActive={params.type === 'passkeys'}
            onPress={() => {
              router.replace('/passkeys/');
            }}
          />
        </Sidebar.Trigger>
        <Sidebar.Trigger href="/codes">
          <PasscodeCard title="Codes" isActive={params.type === 'codes'} />
        </Sidebar.Trigger>
        <Sidebar.Trigger href="/security">
          <PasscodeCard title="Security" isActive={params.type === 'security'} />
        </Sidebar.Trigger>
        <Sidebar.Trigger href="/deleted">
          <PasscodeCard title="Deleted" isActive={params.type === 'deleted'} />
        </Sidebar.Trigger>
      </SafeAreaView>
    </Sidebar>
  );
}

function PasscodeCard({
  onPress,
  title,
  isActive,
}: {
  onPress?: () => void;
  title: string;
  isActive: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: '48%',
        padding: 12,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        height: 50,
        backgroundColor: isActive ? PlatformColor('systemBlue') : PlatformColor('systemGray6'),
      }}>
      <Text style={{ color: isActive ? 'white' : 'black' }}>{title}</Text>
    </Pressable>
  );
}
