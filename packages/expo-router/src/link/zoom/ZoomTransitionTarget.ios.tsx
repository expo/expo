'use client';

import { useMemo, useState } from 'react';

import { LinkZoomTransitionEnabler } from '../preview/native';
import type { ZoomTransitionTargetProps } from './ZoomTransitionTarget.types';
import {
  ZoomTransitionTargetContext,
  type DismissalBoundsRect,
  type ZoomTransitionTargetContextValueType,
} from './zoom-transition-context';

export function ZoomTransitionTarget({
  identifier,
  gestureEnabled,
  children,
}: ZoomTransitionTargetProps) {
  const [dismissalBoundsRect, setDismissalBoundsRect] = useState<DismissalBoundsRect | null>(null);
  const value = useMemo<ZoomTransitionTargetContextValueType>(
    () => ({ identifier, gestureEnabled, setDismissalBoundsRect }),
    [identifier, gestureEnabled]
  );

  return (
    <ZoomTransitionTargetContext value={value}>
      {identifier && (
        <LinkZoomTransitionEnabler
          zoomTransitionSourceIdentifier={identifier}
          dismissalBoundsRect={
            dismissalBoundsRect ?? (gestureEnabled === false ? { maxX: 0, maxY: 0 } : null)
          }
        />
      )}
      {children}
    </ZoomTransitionTargetContext>
  );
}
