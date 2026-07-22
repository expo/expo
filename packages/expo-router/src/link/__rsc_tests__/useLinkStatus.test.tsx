/// <reference types="jest-expo/rsc/expect" />

import { Link } from '../Link';
import { LinkStatusFixture } from './LinkStatusFixture';

// `useLinkStatus` is client-only (it reads context via `use`); the fixture is a `'use client'`
// boundary, so the Link subtree serializes as a client reference and the hook never server-executes.
// Pins that the new export is importable and RSC-safe.
it(`renders a Link with a useLinkStatus consumer`, async () => {
  await expect(
    <Link href="/">
      <LinkStatusFixture />
    </Link>
  ).toMatchFlightSnapshot();
});
