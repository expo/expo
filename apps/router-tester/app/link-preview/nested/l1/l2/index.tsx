import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Links } from '@/components/link-preview/links';

export default function L1Index() {
  const [time, setTime] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={{
        flex: 1,
        gap: 24,
        backgroundColor: '#84A07C',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Text style={{ color: '#000', fontSize: 24 }}>This is L2 - {time}</Text>
      <Links />
    </SafeAreaView>
  );
}
