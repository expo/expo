import { Stack } from 'expo-router';

import '@/global.css';

export const unstable_settings = {
  index: {
    initialRouteName: 'index',
  },
  products: {
    initialRouteName: 'products',
  },
};

export default function Layout() {
  return <Stack></Stack>;
}
