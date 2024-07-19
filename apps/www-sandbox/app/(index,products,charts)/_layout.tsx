import { Stack } from 'expo-router';

import '@/global.css';

export const unstable_settings = {
  index: {
    initialRouteName: 'index',
  },
  products: {
    initialRouteName: 'products',
  },
  charts: {
    initialRouteName: 'charts',
  },
};

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        contentStyle: {
          backgroundColor: 'white',
        },
      }}
    />
  );
}
