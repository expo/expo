import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text } from 'react-native';

const examples = [
  ['Layout boundary', '/error-boundaries/layout'],
  ['Navigator boundary', '/error-boundaries/navigator'],
  ['Screen boundary', '/error-boundaries/screen'],
  ['Route boundary', '/error-boundaries/route'],
] as const;

export default function ErrorBoundaryExamples() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={{ gap: 16, padding: 24 }}>
      <Text>Production error boundary examples</Text>
      {examples.map(([label, href]) => (
        <Pressable
          key={href}
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={() => router.push(href)}
          style={{ backgroundColor: '#0b6caf', padding: 16, borderRadius: 8 }}>
          <Text style={{ color: '#fff' }}>{label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
