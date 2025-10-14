import { SplitView, useGlobalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { PlatformColor, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-screens/experimental';

const passkeys = ['Github', 'Google', 'Facebook', 'Twitter', 'Apple', 'Microsoft', 'Amazon'];
const security = ['Admin1234', 'Root'];

const all = [...passkeys, ...security];

export default function Layout() {
  const params = useGlobalSearchParams();
  const data = (() => {
    switch (params.type) {
      case 'all':
      case undefined:
        return all;
      case 'passkeys':
        return passkeys;
      case 'security':
        return security;
      default:
        return [];
    }
  })();
  return (
    <SplitView>
      <SplitView.Column>
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
          <PasscodeCard title="All" param="all" />
          <PasscodeCard title="Passkeys" param="passkeys" />
          <PasscodeCard title="Codes" param="codes" />
          <PasscodeCard title="Security" param="security" />
          <PasscodeCard title="Deleted" param="deleted" />
        </SafeAreaView>
      </SplitView.Column>
      <SplitView.Column>
        <SafeAreaView
          edges={{ top: true, left: true }}
          style={{
            flex: 1,
            gap: 8,
            backgroundColor: PlatformColor('lightGray'),
          }}>
          {data.map((item, index) => (
            <PasswordElement key={item} title={item} />
          ))}
        </SafeAreaView>
      </SplitView.Column>
    </SplitView>
  );
}

function PasscodeCard({ param, title }: { param: string; title: string }) {
  const router = useRouter();
  const params = useGlobalSearchParams();
  const isActive = params.type === param;
  return (
    <Pressable
      onPress={() => {
        if (!isActive) {
          router.replace(`/${param}/`);
        }
      }}
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

function PasswordElement({ title }: { title: string }) {
  const router = useRouter();
  const params = useGlobalSearchParams();
  const isActive = params.id === title;
  return (
    <Pressable
      onPress={() => {
        if (!isActive) {
          router.replace(`/${params.type}/${title}/`);
        }
      }}
      style={{
        backgroundColor: isActive ? PlatformColor('systemBlue') : undefined,
        padding: 12,
      }}>
      <Text style={{ color: isActive ? 'white' : 'black', fontSize: 16 }}>{title}</Text>
    </Pressable>
  );
}
