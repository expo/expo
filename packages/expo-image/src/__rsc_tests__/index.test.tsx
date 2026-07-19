/// <reference types="jest-expo/rsc/expect" />

import { Image } from 'expo-image';

it(`renders Image`, async () => {
  await expect(<Image />).toMatchFlightSnapshot();
  await expect(<Image />).not.toMatchFlight(expect.stringMatching(/\$undefined/));
});
