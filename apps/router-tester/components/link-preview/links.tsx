import { Link } from 'expo-router';
import { View } from 'react-native';

export function Links() {
  return (
    <View
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
      }}>
      <Link href="/">Normal Link to /home</Link>
      <Link href="/link-preview/nested">
        <Link.Trigger> Link to /nested</Link.Trigger>
        <Link.Preview />
      </Link>
      <Link href="/link-preview/nested/l1">
        <Link.Trigger> Link to /nested/l1</Link.Trigger>
        <Link.Preview />
      </Link>
      <Link href="/link-preview/nested/l1/l2">
        <Link.Trigger> Link to /nested/l1/l2</Link.Trigger>
        <Link.Preview />
      </Link>
      <Link href="/link-preview/nested/l3">
        <Link.Trigger> Link to /nested/l3</Link.Trigger>
        <Link.Preview />
      </Link>
      <Link href="/link-preview/nested/l3/l4">
        <Link.Trigger> Link to /nested/l3/l4</Link.Trigger>
        <Link.Preview />
      </Link>
    </View>
  );
}
