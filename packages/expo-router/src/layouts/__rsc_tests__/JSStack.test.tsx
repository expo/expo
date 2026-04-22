/// <reference types="jest-expo/rsc/expect" />

import Stack from '../JSStack';

it(`renders to RSC`, async () => {
  const jsx = <Stack.Screen options={{ title: '...' }} />;

  await expect(jsx).toMatchFlightSnapshot();
});
