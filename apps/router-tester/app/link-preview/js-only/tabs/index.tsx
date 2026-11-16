import { Link, usePathname } from 'expo-router';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Index() {
  const pathname = usePathname();
  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={{
        flex: 1,
        backgroundColor: '#84DCC6',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Text>Index tab</Text>
      <Text style={{ marginBottom: 16 }}>Current Path: {pathname}</Text>
      <Link href="/link-preview/js-only/tabs/second">
        <Link.Trigger>Link.Preview: /js-only/tabs/second</Link.Trigger>
        <Link.Preview />
      </Link>
    </SafeAreaView>
  );
}
