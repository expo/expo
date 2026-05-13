import { Slot } from 'expo-router';

import { DevToolsConnectionProvider } from '@/hooks/useDevToolsConnection';

import '../global.css';

export default function RootLayout() {
  return (
    <DevToolsConnectionProvider>
      <Slot />
    </DevToolsConnectionProvider>
  );
}
