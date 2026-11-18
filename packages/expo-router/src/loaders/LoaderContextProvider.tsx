'use client';

import { type PropsWithChildren, use, useEffect, useState } from 'react';

import { defaultLoaderRuntime, LoaderContext } from './LoaderContext';
import { LoaderRuntime } from './LoaderRuntime';

export function LoaderContextProvider({ children }: PropsWithChildren) {
  const inherited = use(LoaderContext);
  const [runtime] = useState(() =>
    inherited === defaultLoaderRuntime ? new LoaderRuntime() : inherited
  );
  useEffect(() => runtime.mount(), [runtime]);
  return <LoaderContext value={runtime}>{children}</LoaderContext>;
}
