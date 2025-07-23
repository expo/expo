import { Link } from 'expo-router';
import { View } from 'react-native';

export function Links() {
  return (
    <View
      style={{
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
      }}>
      <Link href="/">
        <Link.Trigger> Link to /</Link.Trigger>
        <Link.Preview />
      </Link>
      <Link href="/faces/">
        <Link.Trigger> Link to /faces/l3</Link.Trigger>
        <Link.Preview />
      </Link>
      <Link href="/faces/l3">
        <Link.Trigger> Link to /faces/l3</Link.Trigger>
        <Link.Preview />
      </Link>
      <Link href="/faces/l3/l4">
        <Link.Trigger> Link to /faces/l3/l4</Link.Trigger>
        <Link.Preview />
      </Link>
      <Link href="/faces/l1">
        <Link.Trigger> Link to /faces/l1</Link.Trigger>
        <Link.Preview />
      </Link>
      <Link href="/faces/l1/l2">
        <Link.Trigger> Link to /faces/l1/l2</Link.Trigger>
        <Link.Preview />
      </Link>
    </View>
  );
}
