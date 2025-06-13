import { Link, usePathname } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
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

  return (
    <View style={{ flex: 1, backgroundColor: '#fdd', paddingTop: top }}>
      <Text>Home - Index</Text>
      <Text>Current Path: {pathname}</Text>
      <Text style={{ marginBottom: 16 }}>Time: {time}</Text>
      <Link href="/(tabs)/home" experimentalPreview>
        experimentalPreview: /(tabs)/home
      </Link>
      <Link href="/(tabs)/home/one">Normal link: /(tabs)/home/one</Link>
      <Link href="/(tabs)/home/one" experimentalPreview>
        experimentalPreview: /(tabs)/home/one
      </Link>
      <Link href="/(tabs)/home/one">
        <Link.Trigger>Link.Preview: /(tabs)/home/one</Link.Trigger>
        <Link.Preview />
      </Link>
      <Link href={`/(tabs)/home/two?time=${time}`} experimentalPreview>
        /(tabs)/home/two?time={time}
      </Link>
      <Link href="/(tabs)/home/one">
        <Link.Trigger>Link.Menu: /(tabs)/home/one</Link.Trigger>
        <Link.Preview />
        <Link.Menu>
          <Link.MenuItem title="Share" onPress={() => {}} />
          <Link.MenuItem title="Copy" onPress={() => {}} />
          <Link.MenuItem title="Delete" onPress={() => {}} />
        </Link.Menu>
      </Link>
      <Link href="/(tabs)/settings" experimentalPreview>
        experimentalPreview: /(tabs)/settings
      </Link>
      <Link href="/(tabs)/home/slot/one" experimentalPreview>
        experimentalPreview: /(tabs)/home/slot/one
      </Link>
    </View>
  );
};

export default HomeIndex;
