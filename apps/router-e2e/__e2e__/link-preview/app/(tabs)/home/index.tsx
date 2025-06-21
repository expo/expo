import { Link, usePathname } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HomeIndex = () => {
  const pathname = usePathname();
  const startTime = useRef(Date.now());
  const [time, setTime] = useState(0);
  const { top } = useSafeAreaInsets();
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);
  const { width } = useWindowDimensions();

  return (
    <View style={{ flex: 1, backgroundColor: '#fdd', paddingTop: top }}>
      <Text>Home - Index</Text>
      <Text>Current Path: {pathname}</Text>
      <Text style={{ marginBottom: 16 }}>Time: {time}</Text>
      <Link href="/home">
        <Link.Trigger>Link.Preview: /home</Link.Trigger>
        <Link.Preview />
      </Link>
      <Link href="/(tabs)/home/one">Normal link: /(tabs)/home/one</Link>
      <Link href="/(tabs)/home/one">
        <Link.Trigger>Link.Preview: /(tabs)/home/one</Link.Trigger>
        <Link.Preview />
      </Link>
      <Link href="/(tabs)/home/one">
        <Link.Trigger>Link.Preview 200x100: /(tabs)/home/one</Link.Trigger>
        <Link.Preview width={200} height={100} />
      </Link>
      <Link href="/(tabs)/home/one">
        <Link.Trigger>Link.Preview 16:9: /(tabs)/home/one</Link.Trigger>
        <Link.Preview width={width} height={width * (9 / 16)} />
      </Link>
      <Link href={`/(tabs)/home/two?time=${time}`}>
        <Link.Trigger>/(tabs)/home/two?time={time}</Link.Trigger>
        <Link.Preview />
      </Link>
      <Link href="/(tabs)/home/one">
        <Link.Trigger>Link.Menu: /(tabs)/home/one</Link.Trigger>
        <Link.Preview />
        <Link.Menu>
          <Link.MenuAction title="Share" onPress={() => {}} />
          <Link.MenuAction title="Copy" onPress={() => {}} />
          <Link.MenuAction title="Delete" onPress={() => {}} />
        </Link.Menu>
      </Link>
      <Link href="/(tabs)/settings">
        <Link.Trigger>Link.Preview: /(tabs)/settings</Link.Trigger>
        <Link.Preview />
      </Link>
      <Link href="/(tabs)/home/slot/one">
        <Link.Trigger>Link.Preview: /(tabs)/home/slot/one</Link.Trigger>
        <Link.Preview />
      </Link>
    </View>
  );
};

export default HomeIndex;
