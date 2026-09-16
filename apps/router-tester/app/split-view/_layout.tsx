import { Button, Toolbar } from '@expo/ui/swift-ui';
import { Link, router, Slot, usePathname } from 'expo-router';
import React from 'react';
import { PlatformColor, Pressable, ScrollView, Text, View } from 'react-native';
// Available starting from react-native-screens@4.17.0
// import { SafeAreaView } from 'react-native-screens/experimental';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RouterSplitView } from '../../components/router-split-view';

const passkeys = ['Github', 'Google', 'Facebook', 'Twitter', 'Apple', 'Microsoft', 'Amazon'];
const security = ['Admin1234', 'Root'];

const all = [...passkeys, ...security];
const typeTitles: Record<string, string> = {
  all: 'All',
  passkeys: 'Passkeys',
  codes: 'Codes',
  security: 'Security',
  deleted: 'Deleted',
};

export default function Layout() {
  const { type, id } = useSplitViewPath();
  // `preferredCompactColumn` is available on iOS 17 and newer.
  const compactColumn = id ? 'detail' : type ? 'content' : 'sidebar';

  return (
    <RouterSplitView
      compactColumn={compactColumn}
      onCompactColumnChange={(column) => {
        if (column === 'sidebar') {
          router.navigate('/split-view');
        } else if (column === 'content') {
          router.navigate(`/split-view/${type ?? 'all'}`);
        }
      }}
      sidebar={{
        title: 'Passwords',
        children: (
          <SafeAreaView
            // edges={{ top: true, left: true }}
            edges={['left', 'top']}
            style={{
              flex: 1,
              flexWrap: 'wrap',
              gap: 8,
              flexDirection: 'row',
              padding: 8,
            }}>
            <PasscodeCard title="All" param="all" />
            <PasscodeCard title="Passkeys" param="passkeys" />
            <PasscodeCard title="Codes" param="codes" />
            <PasscodeCard title="Security" param="security" />
            <PasscodeCard title="Deleted" param="deleted" />
          </SafeAreaView>
        ),
      }}
      content={{
        title: type ? (typeTitles[type] ?? type) : 'All',
        titleDisplayMode: 'inline',
        children: <PasswordElementList />,
      }}
      detail={{
        title: id ?? 'Detail',
        backButtonHidden: true,
        toolbarItems: id ? (
          <Toolbar.Item placement="topBarLeading">
            <Button
              systemImage="chevron.left"
              label="Back"
              testID="split-view-back"
              onPress={() => router.navigate(`/split-view/${type ?? 'all'}`)}
            />
          </Toolbar.Item>
        ) : undefined,
        children: (
          <View>
            <Slot />
          </View>
        ),
      }}
    />
  );
}

function PasswordElementList() {
  const { type } = useSplitViewPath();
  const data = (() => {
    switch (type) {
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
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: undefined }}>
      {data.map((item) => (
        <PasswordElement key={item} title={item} />
      ))}
    </ScrollView>
  );
}

function PasscodeCard({ param, title }: { param: string; title: string }) {
  const { type } = useSplitViewPath();
  const isActive = type === param || (param === 'all' && type === undefined);
  return (
    <Link
      href={`/split-view/${param}/`}
      // TODO: If we want to remove disable, we need to use TabSlot in SplitView (for this to work, we need to support multiple screens for the same dynamic route)
      disabled={isActive}
      asChild>
      <Pressable
        style={{
          width: '48%',
          padding: 12,
          borderRadius: 12,
          justifyContent: 'center',
          alignItems: 'center',
          height: 50,
          backgroundColor: isActive ? PlatformColor('systemBlue') : PlatformColor('systemGray6'),
        }}>
        <Text style={{ color: isActive ? 'white' : 'black', fontSize: 16 }}>{title}</Text>
      </Pressable>
    </Link>
  );
}

function PasswordElement({ title }: { title: string }) {
  const { type, id } = useSplitViewPath();
  const isActive = id === title;
  return (
    <Link href={`/split-view/${type ?? 'all'}/${title}/`} asChild>
      <Pressable
        style={{
          backgroundColor: isActive ? PlatformColor('systemBlue') : undefined,
          padding: 12,
        }}>
        {/* <SafeAreaView edges={{ left: true }}> */}
        <SafeAreaView edges={['left']}>
          <Text style={{ color: isActive ? 'white' : 'black', fontSize: 16 }}>{title}</Text>
        </SafeAreaView>
      </Pressable>
    </Link>
  );
}

function useSplitViewPath() {
  // Router navigation can retain params from a reused dynamic route, while the pathname is current.
  const [, , type, id] = usePathname().split('/');
  return { type, id };
}
