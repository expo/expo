/// <reference types="jest-expo/rsc/expect" />

import { TransitionPendingFixture } from './TransitionPendingFixture';

// `useNavigationTransitionPending` is client-only (it reads context via `use`); the fixture is a
// `'use client'` boundary, so it serializes as a client reference and the hook never server-executes.
// Pins that the new export is importable and RSC-safe.
it(`renders a useNavigationTransitionPending consumer`, async () => {
  await expect(<TransitionPendingFixture />).toMatchFlightSnapshot();
});
