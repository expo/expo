import { Link, useNavigation, usePathname } from 'expo-router';
import { useDrawerStatus } from 'expo-router/drawer';
import { DrawerActions } from 'expo-router/react-navigation';
import { Text, View, Pressable } from 'react-native';

export default function Home() {
  const pathname = usePathname();
  const navigation = useNavigation();
  const drawerStatus = useDrawerStatus();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
      <Text testID="e2e-screen">Home screen</Text>
      <Text testID="e2e-pathname">{pathname}</Text>
      <Text testID="e2e-drawer-status">{drawerStatus}</Text>
      <Pressable
        testID="e2e-open-drawer"
        style={{ backgroundColor: 'rgb(11, 103, 175)', padding: 16, borderRadius: 8 }}
        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
        <Text style={{ color: '#fff' }}>Open Drawer</Text>
      </Pressable>
      <Link testID="e2e-goto-second" href="/drawer/second" asChild>
        <Pressable style={{ backgroundColor: 'rgb(11, 103, 175)', padding: 16, borderRadius: 8 }}>
          <Text style={{ color: '#fff' }}>Go to Second</Text>
        </Pressable>
      </Link>
    </View>
  );
}
