import { useMemo, useState } from 'react';
import { StyleSheet, useColorScheme, useWindowDimensions } from 'react-native';

import { BottomSheetDialog } from '../../web/BottomSheetDialog';
import type { BottomSheetProps, SnapPoint } from './types';
import { resolveContentPadding } from './utils';

function snapPointToHeightPx(snapPoint: SnapPoint, viewportHeight: number): number {
  if (snapPoint === 'half') return Math.round(viewportHeight * 0.5);
  if (snapPoint === 'full') return viewportHeight;
  if ('fraction' in snapPoint) return Math.round(viewportHeight * snapPoint.fraction);
  return snapPoint.height;
}

function nearestSnapIndex(height: number, snapHeights: number[]): number {
  let nearestIndex = 0;
  let nearestDist = Infinity;
  snapHeights.forEach((snapHeight, index) => {
    const dist = Math.abs(snapHeight - height);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestIndex = index;
    }
  });
  return nearestIndex;
}

/**
 * A modal sheet that slides up from the bottom of the screen.
 */
export function BottomSheet({
  children,
  isPresented,
  onDismiss,
  showDragIndicator = true,
  snapPoints,
  testID,
  contentPadding,
}: BottomSheetProps) {
  const isDark = useColorScheme() === 'dark';
  const { top, bottom, left, right } = resolveContentPadding(contentPadding, {
    top: 16,
    bottom: 16,
    left: 16,
    right: 16,
  });
  const { height: viewportHeight } = useWindowDimensions();
  const snapHeights = useMemo(() => {
    if (!snapPoints?.length) return undefined;
    return snapPoints.map((point) => snapPointToHeightPx(point, viewportHeight));
  }, [snapPoints, viewportHeight]);
  const [snapIndex, setSnapIndex] = useState(0);
  const [wasPresented, setWasPresented] = useState(isPresented);
  if (isPresented !== wasPresented) {
    setWasPresented(isPresented);
    if (isPresented) {
      setSnapIndex(0);
    }
  }

  const height =
    snapHeights && snapHeights.length > 0
      ? snapHeights[Math.min(snapIndex, snapHeights.length - 1)]
      : undefined;

  const bodyStyle = useMemo(
    () => ({
      paddingTop: top,
      paddingBottom: bottom,
      paddingLeft: left,
      paddingRight: right,
    }),
    [top, bottom, left, right]
  );

  return (
    <BottomSheetDialog
      open={isPresented}
      onOpenChange={(open) => {
        if (!open) onDismiss();
      }}
      showHandle={showDragIndicator}
      height={height}
      minSnapHeight={snapHeights?.length ? Math.min(...snapHeights) : undefined}
      onDragEnd={
        snapHeights
          ? (nextHeight) => {
              setSnapIndex(nearestSnapIndex(nextHeight, snapHeights));
            }
          : undefined
      }
      style={isDark ? styles.darkSheet : undefined}
      innerTestID={testID}
      bodyStyle={bodyStyle}>
      {children}
    </BottomSheetDialog>
  );
}

const styles = StyleSheet.create({
  darkSheet: {
    backgroundColor: '#000',
  },
});

export * from './types';
