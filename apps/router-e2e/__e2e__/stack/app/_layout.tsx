import { NativeStack as Stack } from 'expo-router/unstable-native-stack-view';
import { useState } from 'react';

import { IsProtectedContext } from '../utils/contexts';

export default function Layout() {
  const [isProtected, setIsProtected] = useState(true);
  return (
    <IsProtectedContext value={[isProtected, setIsProtected]}>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </IsProtectedContext>
  );
}
