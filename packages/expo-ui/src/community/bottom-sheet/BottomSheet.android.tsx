import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BottomSheetContext, BottomSheetInternalContext } from './context';
import type { BottomSheetMethods, BottomSheetProps } from './types';
import { parseSnapPoint } from './types';
import { Host } from '../../jetpack-compose/Host';
import { ModalBottomSheet, type ModalBottomSheetRef } from '../../jetpack-compose/ModalBottomSheet';
import { RNHostView } from '../../jetpack-compose/RNHostView';

export { useBottomSheet } from './context';

function extractBackgroundColor(
  backgroundStyle: BottomSheetProps['backgroundStyle']
): string | undefined {
  if (!backgroundStyle) return undefined;
  return (StyleSheet.flatten(backgroundStyle) as any)?.backgroundColor;
}

function findNearestSnapPointIndex(
  snapPoints: BottomSheetProps['snapPoints'],
  position: string | number
): number {
  if (!snapPoints || snapPoints.length === 0) return 0;

  const parsedTarget = parseSnapPoint(position);
  let nearestIndex = 0;
  let nearestDistance = Infinity;

  snapPoints.forEach((snapPoint, index) => {
    const parsedSnapPoint = parseSnapPoint(snapPoint);
    if (parsedSnapPoint.type !== parsedTarget.type) return;

    const distance = Math.abs(parsedSnapPoint.value - parsedTarget.value);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  if (nearestDistance !== Infinity) {
    return nearestIndex;
  }

  return typeof position === 'number' ? snapPoints.length - 1 : 0;
}

/**
 * Android implementation of `BottomSheet` using Material3 ModalBottomSheet.
 *
 * @remarks Supports two snap states: partially expanded (~50%) and fully expanded.
 * `snapToIndex(0)` maps to partial, `snapToIndex(lastIndex)` maps to expanded.
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
    enableDynamicSizing = true,
    handleComponent,
    backgroundStyle,
    children,
  } = props;

  const hasMultipleSnapPoints = snapPointsProp != null && snapPointsProp.length > 1;
  const fitToContents = enableDynamicSizing && (!snapPointsProp || snapPointsProp.length === 0);
  const skipPartially = fitToContents || !hasMultipleSnapPoints;
  const maxIndex = snapPointsProp ? snapPointsProp.length - 1 : 0;
  const containerColor = extractBackgroundColor(backgroundStyle);
  const internalContextValue = useMemo(() => ({ fitToContents }), [fitToContents]);
  const clampIndex = useCallback(
    (index: number) => Math.min(Math.max(index, 0), maxIndex),
    [maxIndex]
  );

  const [isOpen, setIsOpen] = useState(indexProp >= 0);
  // Ref mirrors isOpen for use in snapToIndex without adding it as a useMemo dep
  // (adding isOpen to deps would recreate methods on every open/close, destabilizing context)
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;
  const pendingIndexRef = useRef(indexProp >= 0 ? clampIndex(indexProp) : null);
  const sheetRef = useRef<ModalBottomSheetRef>(null);
  // Guards fireCloseCallbacks against double-firing when programmatic hide and
  // a native onDismissRequest race (e.g. swipe-dismiss during auto-close).
  const closedRef = useRef(indexProp < 0);

  // Stable callback refs
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const fireCloseCallbacks = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    onCloseRef.current?.();
    onDismissRef.current?.();
    onChangeRef.current?.(-1);
  }, []);

  // Sync with external index prop changes
  useEffect(() => {
    if (indexProp === -1) {
      pendingIndexRef.current = null;
      setIsOpen(false);
      fireCloseCallbacks();
    } else if (indexProp >= 0) {
      pendingIndexRef.current = clampIndex(indexProp);
      closedRef.current = false;
      setIsOpen(true);
    }
  }, [clampIndex, indexProp, fireCloseCallbacks]);

  useEffect(() => {
    if (!isOpen) return;

    const targetIndex = pendingIndexRef.current ?? 0;
    if (hasMultipleSnapPoints && targetIndex === maxIndex) {
      sheetRef.current?.expand();
    } else if (hasMultipleSnapPoints) {
      sheetRef.current?.partialExpand();
    }
    pendingIndexRef.current = null;
  }, [hasMultipleSnapPoints, isOpen, maxIndex]);

  const handleDismiss = useCallback(() => {
    setIsOpen(false);
    fireCloseCallbacks();
  }, [fireCloseCallbacks]);

  const methods: BottomSheetMethods = useMemo(() => {
    const snapToIndex = (index: number) => {
      if (index === -1) {
        sheetRef.current?.hide().then(() => {
          setIsOpen(false);
          pendingIndexRef.current = null;
          fireCloseCallbacks();
        });
        return;
      }
      const clampedIndex = clampIndex(index);
      pendingIndexRef.current = clampedIndex;
      closedRef.current = false;
      if (!isOpenRef.current) {
        setIsOpen(true);
      } else if (hasMultipleSnapPoints) {
        // Native ModalBottomSheet has two states: partial (~50%) and expanded (full).
        // Map index 0 → partialExpand(), last index → expand().
        if (clampedIndex === maxIndex) {
          sheetRef.current?.expand();
        } else {
          sheetRef.current?.partialExpand();
        }
        pendingIndexRef.current = null;
      }
      onChangeRef.current?.(clampedIndex);
    };

    const close = () => {
      sheetRef.current?.hide().then(() => {
        setIsOpen(false);
        pendingIndexRef.current = null;
        fireCloseCallbacks();
      });
    };

    return {
      snapToIndex,
      snapToPosition: (position: string | number) =>
        snapToIndex(findNearestSnapPointIndex(snapPointsProp, position)),
      expand: () => snapToIndex(maxIndex),
      collapse: () => snapToIndex(0),
      close,
      forceClose: close,
      present: () => snapToIndex(0),
      dismiss: close,
    };
  }, [clampIndex, maxIndex, hasMultipleSnapPoints, fireCloseCallbacks, snapPointsProp]);

  useImperativeHandle(ref, () => methods, [methods]);

  if (!isOpen) {
    return (
      <BottomSheetInternalContext.Provider value={internalContextValue}>
        <BottomSheetContext.Provider value={methods}>{null}</BottomSheetContext.Provider>
      </BottomSheetInternalContext.Provider>
    );
  }

  return (
    <BottomSheetInternalContext.Provider value={internalContextValue}>
      <BottomSheetContext.Provider value={methods}>
        <Host matchContents>
          <ModalBottomSheet
            ref={sheetRef}
            onDismissRequest={handleDismiss}
            skipPartiallyExpanded={skipPartially}
            showDragHandle={handleComponent !== null}
            sheetGesturesEnabled={enablePanDownToClose}
            containerColor={containerColor}
            properties={{
              shouldDismissOnBackPress: enablePanDownToClose,
              shouldDismissOnClickOutside: enablePanDownToClose,
            }}>
            <RNHostView matchContents={fitToContents}>
              <View style={fitToContents ? undefined : { flex: 1 }}>{children}</View>
            </RNHostView>
          </ModalBottomSheet>
        </Host>
      </BottomSheetContext.Provider>
    </BottomSheetInternalContext.Provider>
  );
}
