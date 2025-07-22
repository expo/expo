import { Link } from 'expo-router';
import { ScrollView } from 'react-native';

export default function Index() {
  return (
    <ScrollView
      contentContainerStyle={{ alignItems: 'center', padding: 20, gap: 12 }}
      contentInsetAdjustmentBehavior="automatic">
      <Link href="/formsheet">Formsheet demos</Link>
      <Link href="/pagesheet">Pagesheet demos</Link>
      <Link href="/fullscreen">FullScreen demos</Link>
      <Link href="/animations">Animations demos</Link>
      <Link href="/multiple">Multiple modals demos</Link>
      <Link href="/modal">Nested modal</Link>
    </ScrollView>
  );
}
