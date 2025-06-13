import { Slot, Link } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Layout() {
  const { top } = useSafeAreaInsets();
  return (
    // <View style={{ flex: 1, paddingTop: top }}>
    //   <Link href="/home" experimentalPreview>
    //     Goto Home
    //   </Link>
    <Slot />
    // </View>
  );
}
