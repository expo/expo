/// <reference types="jest-expo/rsc/expect" />

import { ErrorBoundary } from '../ErrorBoundary';

it(`renders ErrorBoundary`, async () => {
  await expect(
    // @ts-expect-error: errors and retry methods cannot be passed here.
    <ErrorBoundary />
  ).toMatchFlightSnapshot();
});
