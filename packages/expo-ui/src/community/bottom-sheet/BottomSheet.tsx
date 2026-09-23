import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useWindowDimensions, type ViewStyle } from 'react-native';

import { BottomSheetDialog } from '../../web/BottomSheetDialog';
import { BottomSheetContext, BottomSheetInternalContext } from './context';
import type { BottomSheetMethods, BottomSheetProps } from './types';
import { parseSnapPoint } from './types';

export { useBottomSheet } from './context';

function resolveSnapPointPx(point: string | number, containerHeight: number): number {
  const parsed = parseSnapPoint(point);
  return parsed.type === 'fraction' ? Math.round(containerHeight * parsed.value) : parsed.value;
}

// Always true on web: BottomSheetView strips flex styles so the sheet can measure content naturally.
const internalContextValue = { fitToContents: true };

const defaultSheetStyle: ViewStyle = {
  paddingHorizontal: 16,
  backgroundColor: '#fff',
  borderTopLeftRadius: 10,
  borderTopRightRadius: 10,
};

/**
 * Web implementation of `BottomSheet` using the HTML dialog element.
 */
export function BottomSheet(props: BottomSheetProps) {
  const {
    ref,
    snapPoints: snapPointsProp,
    index: indexProp = 0,
    onChange,
    onClose,
    onDismiss,
    enablePanDownToClose = false,
    handleComponent,
    backgroundStyle,
    children,
    testID,
  } = props;

  const { height: windowHeight } = useWindowDimensions();

  const hasSnapPoints = snapPointsProp != null && snapPointsProp.length > 0;
  const snapHeights = useMemo(() => {
    if (!hasSnapPoints) return [];
    return snapPointsProp!.map((p) => resolveSnapPointPx(p, windowHeight));
  }, [snapPointsProp, hasSnapPoints, windowHeight]);

  const [isOpen, setIsOpen] = useState(indexProp >= 0);
  // Drives currentHeight for snap-point sheets. The dialog uses CSS height, not native snap points.
  const [snapIndex, setSnapIndex] = useState(() => {
    const maxIndex = hasSnapPoints ? snapHeights.length - 1 : 0;
    return indexProp >= 0 ? Math.min(Math.max(indexProp, 0), maxIndex) : 0;
  });

  // Stable callback refs
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  // Guards fireCloseCallbacks against double-firing.
  const closedRef = useRef(indexProp < 0);

  const fireCloseCallbacks = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    onCloseRef.current?.();
    onDismissRef.current?.();
    onChangeRef.current?.(-1);
  }, []);

  useEffect(() => {
    if (indexProp === -1) {
      setIsOpen(false);
      fireCloseCallbacks();
      return;
    }

    const maxIndex = hasSnapPoints ? snapHeights.length - 1 : 0;
    setSnapIndex(Math.min(Math.max(indexProp, 0), maxIndex));
    closedRef.current = false;
    setIsOpen(true);
  }, [hasSnapPoints, indexProp, snapHeights.length, fireCloseCallbacks]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (!open) fireCloseCallbacks();
    },
    [fireCloseCallbacks]
  );

  const methods: BottomSheetMethods = useMemo(() => {
    const snapToIndex = (index: number) => {
      if (index === -1) {
        setIsOpen(false);
        fireCloseCallbacks();
        return;
      }
      const maxIndex = hasSnapPoints ? snapHeights.length - 1 : 0;
      const clampedIndex = Math.min(Math.max(index, 0), maxIndex);
      closedRef.current = false;
      setSnapIndex(clampedIndex);
      setIsOpen(true);
      onChangeRef.current?.(clampedIndex);
    };

    // Fire close callbacks immediately when `open` is driven from the ref.
    // The closedRef guard inside fireCloseCallbacks prevents double-firing if
    // a user-dismiss event also arrives.
    const close = () => {
      setIsOpen(false);
      fireCloseCallbacks();
    };

    return {
      snapToIndex,
      snapToPosition(position: string | number) {
        if (!hasSnapPoints) return;
        const targetHeight = resolveSnapPointPx(position, windowHeight);
        let nearestIndex = 0;
        let nearestDist = Infinity;
        snapHeights.forEach((h, i) => {
          const dist = Math.abs(h - targetHeight);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestIndex = i;
          }
        });
        snapToIndex(nearestIndex);
      },
      expand: () => snapToIndex(hasSnapPoints ? snapHeights.length - 1 : 0),
      collapse: () => snapToIndex(0),
      close,
      forceClose: close,
      present: () => snapToIndex(0),
      dismiss: close,
    };
  }, [hasSnapPoints, snapHeights, windowHeight, fireCloseCallbacks]);

  useImperativeHandle(ref, () => methods);

  const currentHeight = hasSnapPoints ? snapHeights[snapIndex] : undefined;

  const mergedSheetStyle = useMemo(() => [defaultSheetStyle, backgroundStyle], [backgroundStyle]);

  return (
    <BottomSheetInternalContext.Provider value={internalContextValue}>
      <BottomSheetContext.Provider value={methods}>
        <BottomSheetDialog
          open={isOpen}
          onOpenChange={handleOpenChange}
          dismissible={enablePanDownToClose}
          showHandle={handleComponent !== null}
          height={currentHeight}
          minSnapHeight={hasSnapPoints ? Math.min(...snapHeights) : undefined}
          onDragEnd={
            hasSnapPoints
              ? (nextHeight) => {
                  methods.snapToPosition(nextHeight);
                }
              : undefined
          }
          style={mergedSheetStyle}
          innerTestID={testID}>
          {children}
        </BottomSheetDialog>
      </BottomSheetContext.Provider>
    </BottomSheetInternalContext.Provider>
  );
}
