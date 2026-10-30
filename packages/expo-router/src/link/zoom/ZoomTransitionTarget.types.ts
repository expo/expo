import type { PropsWithChildren } from 'react';

export interface ZoomTransitionTargetProps extends PropsWithChildren {
  identifier: string | null;
  gestureEnabled?: boolean;
}
