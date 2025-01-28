/// <reference types="jest-expo/rsc/expect" />

import React from 'react';

import Stack from '../Stack';

it(`renders to RSC`, async () => {
  const jsx = <Stack.Screen options={{ title: '...' }} />;

  await expect(jsx).toMatchFlightSnapshot();
});
