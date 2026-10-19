'use client';

import { createContext, use, useCallback } from 'react';

import type { NavigationState } from '../react-navigation/routers';
import type { NativeStackRegistration } from './implicitModalWarning';
import type { RouterRegistry } from './routerRegistry';
import type { LinkToOptions } from './types';

export type ImplicitModalWarning = (
  href: string,
  options: LinkToOptions,
  localStacks?: readonly NativeStackRegistration[],
  navigationState?: NavigationState,
  registry?: RouterRegistry
) => void;

export const ImplicitModalWarningContext = createContext<ImplicitModalWarning>(() => {});
export const ImplicitModalWarningRegistryContext = createContext<RouterRegistry | undefined>(
  undefined
);
export const NativeStackRegistrationContext = createContext<readonly NativeStackRegistration[]>([]);

export function useWarnIfCardRouteShowsAsModal(navigationState?: NavigationState) {
  const warn = use(ImplicitModalWarningContext);
  const registry = use(ImplicitModalWarningRegistryContext);
  const nativeStacks = use(NativeStackRegistrationContext);
  return useCallback(
    (href: string, options: LinkToOptions) =>
      warn(href, options, nativeStacks, navigationState, registry),
    [nativeStacks, navigationState, registry, warn]
  );
}
