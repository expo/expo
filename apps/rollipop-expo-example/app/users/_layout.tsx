import { Stack } from 'expo-router';

// Nested layout: every route under /users is wrapped in this stack, proving
// that layouts hoist correctly when getRoutes builds the tree.
export default function UsersLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Users' }} />
      <Stack.Screen name="[id]" options={{ title: 'User' }} />
    </Stack>
  );
}
