import { Link, usePathname } from 'expo-router';
import { Text, View } from 'react-native';

export default function Second() {
  const pathname = usePathname();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#D6EDFF',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Text>Second tab</Text>
      <Text style={{ marginBottom: 16 }}>Current Path: {pathname}</Text>
      <View style={{ height: 150, width: '100%', backgroundColor: '#478978' }}>
        <Text style={{ color: '#fff', textAlign: 'center', padding: 16 }}>
          This is a box to showcase different content in second tab.
        </Text>
      </View>
      <Link href="/js-only/tabs">
        <Link.Trigger>Link.Preview: /js-only/tabs</Link.Trigger>
        <Link.Preview />
      </Link>
    </View>
  );
}
