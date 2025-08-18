import { Link, usePathname } from 'expo-router';
import React from 'react';
import { View, Text, useWindowDimensions, TouchableOpacity, ScrollView } from 'react-native';

import { useTimer } from '../utils/useTimer';

const HomeIndex = () => {
  const pathname = usePathname();
  const time = useTimer();
  const { width } = useWindowDimensions();

  return (
    <ScrollView
      style={{ backgroundColor: '#84DCC6' }}
      contentContainerStyle={{ padding: 16, gap: 16 }}
      contentInsetAdjustmentBehavior="automatic">
      <View>
        <Text>Misc</Text>
        <Text>Current Path: {pathname}</Text>
      </View>
      <Text style={{ marginBottom: 16 }}>Time: {time}</Text>
      <Spacer />
      <Link href="/">
        <Link.Trigger>Link.Preview: /</Link.Trigger>
        <Link.Preview />
      </Link>
      <Spacer />
      <Link href="/one">Normal link: /one</Link>
      <Link href="/one">
        <Link.Trigger>Normal link with trigger: /one</Link.Trigger>
      </Link>
      <Link href="/one" asChild>
        <Link.Trigger>
          <TouchableOpacity>
            <Text>Normal link with trigger asChild: /one</Text>
          </TouchableOpacity>
        </Link.Trigger>
      </Link>
      <Link href="/one">
        <Link.Trigger>
          <Text>Normal link with trigger: /one</Text>
          <View style={{ width: 20, height: 20, backgroundColor: 'orange' }} />
          <Text>Multiple children</Text>
        </Link.Trigger>
      </Link>
      <Link href="/one" asChild>
        <Link.Trigger>
          <TouchableOpacity style={{ backgroundColor: '#fff' }}>
            <Text>Normal link with trigger: /one</Text>
            <View style={{ width: 20, height: 20, backgroundColor: 'orange' }} />
            <Text>Multiple children</Text>
          </TouchableOpacity>
        </Link.Trigger>
      </Link>
      <Link href="/one">
        <Link.Trigger>Link.Preview: /one</Link.Trigger>
        <Link.Preview />
      </Link>
      <Spacer />
      <Link href="/one">
        <Link.Trigger>Link.Preview 200x100: /one</Link.Trigger>
        <Link.Preview width={200} height={100} />
      </Link>
      <Link href="/one">
        <Link.Trigger>Link.Preview 16:9: /one</Link.Trigger>
        <Link.Preview width={width} height={width * (9 / 16)} />
      </Link>
      <Spacer />
      <Link href={`/one?time=${time}`}>
        <Link.Trigger>/one?time={time}</Link.Trigger>
        <Link.Preview />
      </Link>
      <Spacer />
      <Link href="/protected">
        <Link.Trigger>/protected</Link.Trigger>
        <Link.Preview />
      </Link>
      <Spacer />
      <Link href="https://expo.dev" asChild>
        <Link.Trigger>
          <Text>https://expo.dev as Child</Text>
        </Link.Trigger>
        <Link.Preview />
      </Link>
      <Link href="https://expo.dev">
        <Link.Trigger>https://expo.dev</Link.Trigger>
        <Link.Preview />
      </Link>
      <Spacer />
      {/* @ts-expect-error */}
      <Link href="/404">
        <Link.Trigger>Link.Preview: Unmatched Route</Link.Trigger>
        <Link.Preview />
      </Link>
      <Link href="/_sitemap">
        <Link.Trigger>Link.Preview: Sitemap</Link.Trigger>
        <Link.Preview />
      </Link>
    </ScrollView>
  );
};

const Spacer = () => (
  <View
    style={{
      width: '100%',
      height: 16,
    }}
  />
);

export default HomeIndex;
