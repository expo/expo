/// <reference types="jest-expo/rsc/expect" />
import * as React from 'react';

import { Link } from '../Link';

it(`renders Link`, async () => {
  await expect(<Link href="/" />).toMatchFlightSnapshot();
});

it(`renders Link.Trigger`, async () => {
  await expect(
    <Link href="/">
      <Link.Trigger>Trigger</Link.Trigger>
    </Link>
  ).toMatchFlightSnapshot();
});

it(`renders Link.Preview`, async () => {
  await expect(
    <Link href="/">
      <Link.Preview>Preview</Link.Preview>
    </Link>
  ).toMatchFlightSnapshot();
});
