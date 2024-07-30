import { Slot, Stack } from 'expo-router';

import { Action, setItems } from 'expo-quick-actions';

export default function Layout() {
  // if (process.env.EXPO_OS === 'web')
  return <Slot />;
  return (
    <Stack>
      <Stack.Screen name="(root)" options={{ title: 'Expo Router' }} />
    </Stack>
  );
}

// Mock quick actions

const items: Action[] = [
  {
    id: '0',
    title: 'View Orders',
    subtitle: '3 New Orders',
    icon: 'symbol:mail.stack',
  },
  {
    id: '3',
    title: 'Check out',
    subtitle: '14 Items',
    icon: 'symbol:cart',
  },
  {
    id: '1',
    title: 'Search',
    icon: 'search',
  },
  {
    id: '2',
    title: 'View Profile',
    icon: 'symbol:person.2',
  },
];

setItems(items);
