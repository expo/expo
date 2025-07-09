import { Link, usePathname } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, useWindowDimensions, TouchableOpacity } from 'react-native';
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
        <Link.Trigger>Normal link with trigger: /(tabs)/home/one</Link.Trigger>
      </Link>
      <Link href="/(tabs)/home/one" asChild>
        <Link.Trigger>
          <TouchableOpacity>
            <Text>Normal link with trigger asChild: /(tabs)/home/one</Text>
          </TouchableOpacity>
        </Link.Trigger>
      </Link>
      <Link href="/(tabs)/home/one">
        <Link.Trigger>
          <Text>Normal link with trigger: /(tabs)/home/one</Text>
          <View style={{ width: 20, height: 20, backgroundColor: 'orange' }} />
          <Text>Multiple children</Text>
        </Link.Trigger>
      </Link>
      <Link href="/(tabs)/home/one" asChild>
        <Link.Trigger>
          <TouchableOpacity style={{ backgroundColor: '#fff' }}>
            <Text>Normal link with trigger: /(tabs)/home/one</Text>
            <View style={{ width: 20, height: 20, backgroundColor: 'orange' }} />
            <Text>Multiple children</Text>
          </TouchableOpacity>
        </Link.Trigger>
      </Link>
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
        <Link.Menu title="Actions" icon="ellipsis">
          <Link.MenuAction
            title="Share"
            icon="square.and.arrow.up"
            onPress={() => {
              console.log('Share Pressed');
            }}
          />
          <Link.MenuAction
            title="Copy"
            icon="doc.on.doc"
            onPress={() => {
              console.log('Copy Pressed');
            }}
          />
          <Link.MenuAction
            title="Delete"
            icon="trash"
            onPress={() => {
              console.log('Delete Pressed');
            }}
          />
          <Link.Menu title="More" icon="ellipsis">
            <Link.MenuAction
              title="Submenu Item 1"
              onPress={() => {
                console.log('Submenu Item 1 Pressed');
              }}
            />
            <Link.MenuAction
              title="Submenu Item 2"
              onPress={() => {
                console.log('Submenu Item 2 Pressed');
              }}
            />
          </Link.Menu>
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
