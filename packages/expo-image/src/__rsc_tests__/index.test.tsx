/// <reference types="jest-expo/rsc/expect" />

// @ts-expect-error
import { Image } from 'expo-image';
import * as React from 'react';

it(`renders Image`, async () => {
  await expect(<Image />).toMatchFlightSnapshot();
  await expect(<Image />).not.toMatchFlight(expect.stringMatching(/\$undefined/));
});
