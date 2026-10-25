'use client';

import type { PropsWithChildren } from 'react';

import { LocaleDirContext } from './react-navigation/native/LocaleDirContext';
import type { LocaleDirection } from './react-navigation/native/types';

export type LocaleProviderProps = PropsWithChildren<{
  direction: LocaleDirection;
}>;

export function LocaleProvider({ direction, children }: LocaleProviderProps) {
  return <LocaleDirContext.Provider value={direction}>{children}</LocaleDirContext.Provider>;
}
