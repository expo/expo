import { createContext, useContext, useEffect } from 'react';

/**
 * `true` inside a `Host`, where SwiftUI or Jetpack Compose renders the content. `RNHostView` sets it
 * back to `false`, because its children are React Native views again.
 */
export const NativeTreeContext = createContext(false);

export function useIsInsideNativeTree(): boolean {
  return useContext(NativeTreeContext);
}

let warned = false;

/**
 * Warns once in development when a `Host` renders directly inside another `Host`'s native content.
 */
export function useWarnIfNestedHost(layoutSystem: 'SwiftUI' | 'Jetpack Compose'): void {
  const isNested = useIsInsideNativeTree();
  useEffect(() => {
    if (__DEV__ && isNested && !warned) {
      warned = true;
      console.warn(
        `[@expo/ui] A \`Host\` is rendered directly inside another \`Host\`'s ${layoutSystem} content. ` +
          `${layoutSystem} places it, but React Native can't see where, so its layout and \`measure()\` ` +
          `can be wrong, and a \`Pressable\` inside it can cancel its press. Wrap the nested \`Host\` in ` +
          `\`RNHostView\`, or render its ${layoutSystem} components directly in the outer \`Host\`.`
      );
    }
  }, [isNested, layoutSystem]);
}
