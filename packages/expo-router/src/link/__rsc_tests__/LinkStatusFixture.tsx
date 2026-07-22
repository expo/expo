'use client';

import { Text } from 'react-native';

import { useLinkStatus } from '../useLinkStatus';

// A client-boundary consumer of `useLinkStatus`, imported by the RSC test so the hook serializes as a
// client reference (it is client-only — `use(Context)` cannot run in the server renderer).
export function LinkStatusFixture() {
  const { pending } = useLinkStatus();
  return <Text>{pending ? 'pending' : 'idle'}</Text>;
}
