import { useRouter, type Href } from 'expo-router';
import { useNavigationState } from 'expo-router/react-navigation';
import { Pressable, ScrollView, Text } from 'react-native';

const SCREENS: { name: string; href: Href }[] = [
  { name: 'index', href: '/required-screens' },
  { name: 'a', href: '/required-screens/a' },
  { name: 'b', href: '/required-screens/b' },
  { name: 'c', href: '/required-screens/c' },
  { name: 'd', href: '/required-screens/d' },
];

export function RequiredScreensScreen({ name }: { name: string }) {
  const router = useRouter();
  const routeNames = useNavigationState((state) =>
    state.routes.map((route, index) => (index === state.index ? `[${route.name}]` : route.name))
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff' }}
      contentContainerStyle={{ alignItems: 'center', gap: 16, padding: 16 }}
      contentInsetAdjustmentBehavior="automatic">
      <Text testID="required-screens-name">Screen: {name}</Text>
      <Text testID="required-screens-stack">Stack: {routeNames.join(' > ')}</Text>
      {SCREENS.map((screen) => (
        <Pressable
          key={screen.name}
          testID={`required-screens-push-${screen.name}`}
          accessibilityRole="button"
          onPress={() => router.push(screen.href)}
          style={{ backgroundColor: 'rgb(11, 103, 175)', padding: 16, borderRadius: 8 }}>
          <Text style={{ color: '#fff' }}>Push {screen.name}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
