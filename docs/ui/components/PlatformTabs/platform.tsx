import { PropsWithChildren, createContext, useContext, useMemo, useState } from 'react';

export type Platform = 'android' | 'ios';

export type PlatformImage = {
  src: string;
  darkSrc?: string;
  alt: string;
};

const PLATFORM_ORDER: Platform[] = ['android', 'ios'];

export const orderPlatforms = (images: Partial<Record<Platform, unknown>>): Platform[] =>
  PLATFORM_ORDER.filter(platform => images[platform] !== undefined);

type PlatformContextValue = {
  platform: Platform;
  setPlatform: (platform: Platform) => void;
};

const PlatformContext = createContext<PlatformContextValue | null>(null);

/**
 * Idempotent on purpose: a component that needs shared platform state can wrap itself, and the
 * page-wide group still wins when one is already present. Nesting a second provider would split
 * the page into two independent selections, which is never what a page wants.
 */
export function PlatformTabsGroup({ children }: PropsWithChildren) {
  const existing = useContext(PlatformContext);
  const [platform, setPlatform] = useState<Platform>(PLATFORM_ORDER[0]);
  const value = useMemo(() => ({ platform, setPlatform }), [platform]);
  if (existing) {
    return children;
  }
  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatformSelection(available: Platform[]) {
  const shared = useContext(PlatformContext);
  const [local, setLocal] = useState<Platform>(PLATFORM_ORDER[0]);
  const preferred = shared?.platform ?? local;
  const active = available.includes(preferred) ? preferred : available[0];
  return { active, select: shared?.setPlatform ?? setLocal };
}
