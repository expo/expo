import { Stack } from 'expo-router';
import { useState } from 'react';

import { PeekAndPopContextProvider } from '@/components/PeekAndPopContext';

export default function Layout() {
  const [isGlobalTapped, setIsGlobalTapped] = useState(false);

  return (
    <PeekAndPopContextProvider value={{ isGlobalTapped, setIsGlobalTapped }}>
      <Stack
        screenOptions={{ headerShown: false, animation: isGlobalTapped ? 'none' : undefined }}
      />
    </PeekAndPopContextProvider>
  );
}
