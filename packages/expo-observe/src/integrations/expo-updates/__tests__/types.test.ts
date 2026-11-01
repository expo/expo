import type { readLogEntriesAsync, UpdatesLogEntry, UpdatesLogEntryCode } from 'expo-updates';

import type { ObserveExpoUpdatesLogEntry, ObserveExpoUpdatesLogEntryCode } from '../../../types';
import type { LoadedUpdates } from '../updates';

// `types.ts` declares its own types for the expo-updates log so that expo-updates stays an optional
// peer dependency. These checks fail to compile if the expo-updates types diverge from them.

type Expect<T extends true> = T;
type Extends<A, B> = [A] extends [B] ? true : false;

export type _UpdatesEntryFitsOurs = Expect<Extends<UpdatesLogEntry, ObserveExpoUpdatesLogEntry>>;
export type _CodesMatch = Expect<
  Extends<`${UpdatesLogEntryCode}`, ObserveExpoUpdatesLogEntryCode> &
    Extends<ObserveExpoUpdatesLogEntryCode, `${UpdatesLogEntryCode}`>
>;
export type _ReadLogEntriesFitsOurs = Expect<
  Extends<typeof readLogEntriesAsync, LoadedUpdates['readLogEntriesAsync']>
>;

describe('expo-updates types', () => {
  it('type-checks', () => {
    expect(true).toBe(true);
  });
});
