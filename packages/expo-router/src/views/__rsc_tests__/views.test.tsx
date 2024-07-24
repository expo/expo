/// <reference types="jest-expo/rsc/expect" />
import * as React from 'react';

import { EmptyRoute } from '../EmptyRoute';
import { ErrorBoundary } from '../ErrorBoundary';
import { Screen } from '../Screen';
import { Sitemap } from '../Sitemap';

it(`renders Screen`, async () => {
  await expect(<Screen />).toMatchFlightSnapshot();
});

it(`renders Sitemap`, async () => {
  await expect(<Sitemap />).toMatchFlightSnapshot();
});
it(`renders EmptyRoute`, async () => {
  await expect(<EmptyRoute />).toMatchFlightSnapshot();
});

it(`renders ErrorBoundary`, async () => {
  await expect(
    // @ts-expect-error: errors and retry methods cannot be passed here.
    <ErrorBoundary />
  ).toMatchFlightSnapshot();
});
