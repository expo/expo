import { Link } from 'expo-router';
import { DynamicColor } from 'expo-system-ui';
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';

const colors = [
  DynamicColor('Primary'),
  DynamicColor('Secondary'),
  DynamicColor('Tertiary'),
  '#1e3a8a',
  '#fef7ed',
  '#9ca3af',
  '#d1a3a4',
  '#6b7280',
  '#fffff0',
  '#c4b5fd',
  '#a8a29e',
  '#fbbf24',
  '#374151',
];

export function Faces(props: { numberOfFaces: number }) {
  const faces = useMemo(
    () =>
      Array.from({ length: props.numberOfFaces }, (_, i) => ({
        id: i,
        color: colors[i % colors.length],
      })),
    [props.numberOfFaces]
  );
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
      {faces.map((face) => (
        <Link key={face.id} href={`/faces/${face.color.split('#')[1]}`} asChild>
          <Link.Trigger>
            <Pressable style={{ borderRadius: 16, overflow: 'hidden' }}>
              <View style={{ backgroundColor: face.color, width: 100, height: 100 }} />
            </Pressable>
          </Link.Trigger>
          <Link.Preview />
        </Link>
      ))}
    </View>
  );
}
