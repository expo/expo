import React from 'react';

import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';


it(`renders safe area context to RSC`, async () => {
  const jsx = (<SafeAreaProvider>
    <SafeAreaView />
  </SafeAreaProvider>);

  await expect(jsx).toMatchFlightSnapshot();
});
