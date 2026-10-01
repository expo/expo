import { createContext, use, useMemo, type PropsWithChildren } from 'react';

import type { SafeAreaEdges } from '../safe-area.types';

const disabledEdges = { left: false, right: false, top: false, bottom: false };
export const SafeAreaEdgesContext = createContext({
  left: true,
  right: true,
  top: false,
  bottom: false,
});

export function SafeAreaEdgesProvider({
  children,
  options,
}: PropsWithChildren<{
  options: {
    safeAreaEdges?: SafeAreaEdges;
    disableAutomaticContentInsets?: boolean;
  };
}>) {
  const inherited = use(SafeAreaEdgesContext);
  const { safeAreaEdges: local, disableAutomaticContentInsets } = options;
  const edges = useMemo(() => {
    // A tab's opt-out also disables padding in descendant stacks unless they explicitly enable it.
    const base = disableAutomaticContentInsets ? disabledEdges : inherited;
    return {
      left: local?.left ?? local?.horizontal ?? base.left,
      right: local?.right ?? local?.horizontal ?? base.right,
      top: local?.top ?? local?.vertical ?? base.top,
      bottom: local?.bottom ?? local?.vertical ?? base.bottom,
    };
  }, [inherited, local, disableAutomaticContentInsets]);
  return <SafeAreaEdgesContext value={edges}>{children}</SafeAreaEdgesContext>;
}
