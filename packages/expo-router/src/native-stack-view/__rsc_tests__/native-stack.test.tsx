/// <reference types="jest-expo/rsc/expect" />
import * as React from 'react';

import { NativeStack } from '../NativeStack';

it(`renders NativeStack`, async () => {
  await expect(<NativeStack />).toMatchFlightSnapshot();
});
