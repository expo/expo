/// <reference types="jest-expo/rsc/expect" />

import React from 'react';

import Stack from '../Stack';

it(`renders to RSC`, async () => {
  const jsx = <Stack.Screen options={{ title: '...' }} />;

  await expect(jsx).toMatchFlightSnapshot();
});

it(`renders Stack.Toolbar to RSC`, async () => {
  const jsx = (
    <>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button />
        <Stack.Toolbar.View />
        <Stack.Toolbar.Spacer />
        <Stack.Toolbar.Menu />
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button />
      </Stack.Toolbar>
      <Stack.Toolbar>
        <Stack.Toolbar.SearchBarSlot />
      </Stack.Toolbar>
    </>
  );

  await expect(jsx).toMatchFlightSnapshot();
});
