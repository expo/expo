import { Link, type Href } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export function Post(props: { title: string; href: Href }) {
  return (
    <Link href={props.href} asChild>
      <Link.Trigger>
        <Pressable
          style={{
            flex: 1,
            width: '100%',
            gap: 8,
            backgroundColor: '#000',
          }}>
          <Text style={{ color: '#fff', fontSize: 18 }}>{props.title}</Text>
          <View
            style={{ width: '100%', aspectRatio: 1, backgroundColor: '#9ca3af', borderRadius: 8 }}
          />
        </Pressable>
      </Link.Trigger>
      <Link.Preview />
    </Link>
  );
}
