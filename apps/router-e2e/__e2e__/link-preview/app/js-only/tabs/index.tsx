import { Link, usePathname } from 'expo-router';
import { Text, View } from 'react-native';

export default function Index() {
  const pathname = usePathname();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#84DCC6',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Text>Index tab</Text>
      <Text style={{ marginBottom: 16 }}>Current Path: {pathname}</Text>
      <Link href="/js-only/tabs/second">
        <Link.Trigger>Link.Preview: /js-only/tabs/second</Link.Trigger>
        <Link.Preview />
      </Link>
    </View>
  );
}
