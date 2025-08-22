import { Link } from 'expo-router';
import { View } from 'react-native';

import { useTimer } from '../../utils/useTimer';

export default function Mosaic() {
  const time = useTimer(100);
  const rows = Array.from({ length: 20 });
  const singleRow = Array.from({ length: 100 });

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {rows.map((_, rowIndex) => (
        <View key={rowIndex} style={{ flexDirection: 'row', height: '2%' }}>
          {singleRow.map((_, colIndex) => (
            <View
              key={`${rowIndex}-${colIndex}`}
              style={{
                width: `1%`,
                backgroundColor: (time + 20) % 100 === colIndex ? '#f00' : '#ccc',
              }}
            />
          ))}
        </View>
      ))}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Link href="/performance/one">
          <Link.Trigger>Link.Preview: /performance/one</Link.Trigger>
          <Link.Preview />
        </Link>
        <Link href="/performance">
          <Link.Trigger>Link.Preview: /performance</Link.Trigger>
          <Link.Preview />
        </Link>
      </View>
      {rows.map((_, rowIndex) => (
        <View key={rowIndex} style={{ flexDirection: 'row', height: '2%' }}>
          {singleRow.map((_, colIndex) => (
            <View
              key={`${rowIndex}-${colIndex}`}
              style={{
                width: `1%`,
                backgroundColor: (time + 20) % 100 === colIndex ? '#f00' : '#ccc',
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
