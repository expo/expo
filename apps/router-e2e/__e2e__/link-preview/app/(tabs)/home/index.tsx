import { Link, usePathname } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Text, useWindowDimensions, Pressable, ScrollView } from 'react-native';

const HomeIndex = () => {
  const pathname = usePathname();
  const startTime = useRef(Date.now());
  const [time, setTime] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);
  const { width } = useWindowDimensions();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: '#fdd' }}
      contentContainerStyle={{ flex: 1 }}>
      <Text>Home - Index</Text>
      <Text>Current Path: {pathname}</Text>
      <Text style={{ marginBottom: 16 }}>Time: {time}</Text>
      <Link href="/(tabs)/home/one" asChild>
        <Link.Preview />
        <Link.Trigger>Link.Preview: This should not be visible</Link.Trigger>
      </Link>
      <Link href="/(tabs)/home/one" asChild>
        NormalLink: This should not be visible
      </Link>
      <Link href="/(tabs)/home" style={{ flex: 1, backgroundColor: 'gray' }}>
        Normal link: /(tabs)/home
      </Link>
      <Link href="/(tabs)/home/one" style={{ width: '100%', backgroundColor: 'orange' }}>
        <Link.Preview />
        <Link.Trigger>width100 Link.Preview: /home/one</Link.Trigger>
      </Link>
      <Link href="/(tabs)/home/one" style={{ flex: 1, backgroundColor: 'lightblue' }}>
        <Link.Preview />
        <Link.Trigger>flex1 Link.Preview: /home/one</Link.Trigger>
      </Link>
      <Link href="/(tabs)/home/one" style={{ width: '100%', backgroundColor: 'orange' }} asChild>
        <Link.Preview />
        <Link.Trigger>
          <Pressable style={{ flex: 1 }}>
            <Text>asChild width100 Link.Preview: /home/one</Text>
          </Pressable>
        </Link.Trigger>
      </Link>
      <Link href="/(tabs)/home/one" style={{ flex: 1, backgroundColor: 'lightblue' }} asChild>
        <Link.Preview />
        <Link.Trigger>
          <Pressable style={{ flex: 1 }}>
            <Text>asChild flex1 Link.Preview: /home/one</Text>
          </Pressable>
        </Link.Trigger>
      </Link>
      <Link href="/(tabs)/home/one" style={{ backgroundColor: 'green' }} asChild>
        <Link.Preview />
        <Link.Trigger>
          <Pressable style={{ flex: 1 }}>
            <Text>asChild Link.Preview: /home/one</Text>
          </Pressable>
        </Link.Trigger>
      </Link>
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
    </ScrollView>
  );
};

export default HomeIndex;
