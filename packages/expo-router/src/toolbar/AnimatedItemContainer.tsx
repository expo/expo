import type { ReactNode } from 'react';

/**
 * No-op fallback for non-Android platforms.
 */
export function AnimatedItemContainer({ children }: { visible: boolean; children: ReactNode }) {
  return <>{children}</>;
}
