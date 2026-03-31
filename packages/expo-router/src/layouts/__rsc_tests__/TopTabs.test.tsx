/// <reference types="jest-expo/rsc/expect" />

import React from 'react';

import TopTabs from '../TopTabs';

it(`renders to RSC`, async () => {
  const jsx = <TopTabs.Screen options={{ title: '...' }} />;

  await expect(jsx).toMatchFlightSnapshot();
});
