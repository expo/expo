import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Links } from '@/__e2e__/link-preview/components/links';

export default function L1Index() {
  const [time, setTime] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <View
      style={{
        flex: 1,
        gap: 24,
        backgroundColor: '#84A07C',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Text style={{ color: '#000', fontSize: 24 }}>This is L2 - {time}</Text>
      <Links />
    </View>
  );
}
