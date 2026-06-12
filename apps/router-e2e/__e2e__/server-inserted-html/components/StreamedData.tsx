import { useServerInsertedHTML } from 'expo-router';
import React, { createContext, use, useRef, type PropsWithChildren } from 'react';

declare global {
  // eslint-disable-next-line no-var
  var __E2E_STREAMED_DATA__: [string, string][] | undefined;
}

type StreamedDataEntry = {
  promise: Promise<string>;
  resolved?: string;
  flushed?: boolean;
};

type StreamedDataCache = Map<string, StreamedDataEntry>;

const StreamedDataContext = createContext<StreamedDataCache | null>(null);

/**
 * A minimal streamed data transport, mimicking what suspense-based data libraries
 * (urql, Apollo, TanStack Query) do with `useServerInsertedHTML()`:
 *
 * - On the server, suspense query results that resolved since the previous React flush
 *   are serialized into a `<script>` tag that is injected into the HTML stream right
 *   before the React chunk revealing the Suspense content that used them.
 * - On the client, the injected scripts have already populated
 *   `globalThis.__E2E_STREAMED_DATA__` by the time the matching Suspense boundary
 *   hydrates, so the data is read from the stream instead of being fetched again.
 */
export function StreamedDataProvider({ children }: PropsWithChildren) {
  const cache = useRef<StreamedDataCache>(new Map()).current;

  useServerInsertedHTML(() => {
    const unflushed = [...cache.entries()].filter(
      ([, entry]) => entry.resolved !== undefined && !entry.flushed
    );
    if (unflushed.length === 0) {
      return null;
    }
    for (const [, entry] of unflushed) {
      entry.flushed = true;
    }
    const payload = JSON.stringify(unflushed.map(([key, entry]) => [key, entry.resolved])).replace(
      /</g,
      '\\u003c'
    );
    return (
      <script
        dangerouslySetInnerHTML={{
          __html: `(globalThis.__E2E_STREAMED_DATA__ = globalThis.__E2E_STREAMED_DATA__ || []).push(...${payload});`,
        }}
      />
    );
  });

  return <StreamedDataContext.Provider value={cache}>{children}</StreamedDataContext.Provider>;
}

export function useStreamedValue(
  key: string,
  load: () => Promise<string>
): { value: string; source: 'stream' | 'fetched' } {
  const cache = use(StreamedDataContext);
  if (!cache) {
    throw new Error('useStreamedValue must be used within a StreamedDataProvider');
  }

  if (typeof window !== 'undefined') {
    const injected = (globalThis.__E2E_STREAMED_DATA__ ?? []).find(
      ([injectedKey]) => injectedKey === key
    );
    if (injected) {
      return { value: injected[1], source: 'stream' };
    }
  }

  let entry = cache.get(key);
  if (!entry) {
    const newEntry: StreamedDataEntry = {
      promise: load().then((value) => {
        newEntry.resolved = value;
        return value;
      }),
    };
    entry = newEntry;
    cache.set(key, entry);
  }

  return { value: use(entry.promise), source: 'fetched' };
}
