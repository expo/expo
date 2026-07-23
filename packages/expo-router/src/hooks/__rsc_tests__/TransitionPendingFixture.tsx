'use client';

import { Text } from 'react-native';

import { useNavigationTransitionPending } from '../useNavigationTransitionPending';

// A client-boundary consumer of `useNavigationTransitionPending`, imported by the RSC test so the
// hook serializes as a client reference (it is client-only — `use(Context)` cannot run in the server
// renderer).
export function TransitionPendingFixture() {
  const pending = useNavigationTransitionPending();
  return <Text>{pending ? 'pending' : 'idle'}</Text>;
}
