import { Link } from 'expo-router';
import { ScrollView, View } from 'react-native';

const colors = [
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

const faces = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  color: colors[i % colors.length],
}));

export default function Index() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: '#000' }}
      contentContainerStyle={{
        alignItems: 'center',
        padding: 32,
      }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
        {faces.map((face) => (
          <Link
            key={face.id}
            href={`/faces/${face.color.split('#')[1]}`}
            style={{ backgroundColor: face.color, width: 100, height: 100, borderRadius: 16 }}
          />
        ))}
      </View>
    </ScrollView>
  );
}
