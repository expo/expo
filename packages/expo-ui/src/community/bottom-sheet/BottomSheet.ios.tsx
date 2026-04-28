import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import { BottomSheetContext, BottomSheetInternalContext } from './context';
import type { BottomSheetMethods, BottomSheetProps } from './types';
import { parseSnapPoint } from './types';
import { BottomSheet as NativeBottomSheet } from '../../swift-ui/BottomSheet';
import { Group } from '../../swift-ui/Group';
import { Host } from '../../swift-ui/Host';
import { RNHostView } from '../../swift-ui/RNHostView';
import {
  type PresentationDetent,
  interactiveDismissDisabled,
  presentationDetents,
  presentationDragIndicator,
} from '../../swift-ui/modifiers/presentationModifiers';

export { useBottomSheet } from './context';

// #region Helpers

function snapPointToDetent(point: string | number): PresentationDetent {
  const parsed = parseSnapPoint(point);
  return parsed.type === 'fraction' ? { fraction: parsed.value } : { height: parsed.value };
}

function detentsAreEqual(a: PresentationDetent, b: PresentationDetent): boolean {
  if (typeof a === 'string' && typeof b === 'string') return a === b;
  if (typeof a === 'object' && typeof b === 'object') {
    if ('fraction' in a && 'fraction' in b) return a.fraction === b.fraction;
    if ('height' in a && 'height' in b) return a.height === b.height;
  }
  return false;
}

function findDetentIndex(detents: PresentationDetent[], detent: PresentationDetent): number {
  return detents.findIndex((d) => detentsAreEqual(d, detent));
}

function findNearestDetentIndex(detents: PresentationDetent[], position: string | number): number {
  const parsed = parseSnapPoint(position);
  let nearestIndex = 0;
  let nearestDist = Infinity;
  detents.forEach((d, i) => {
    const detent =
      typeof d === 'string'
        ? d === 'medium'
          ? { type: 'fraction' as const, value: 0.5 }
          : { type: 'fraction' as const, value: 1.0 }
        : 'fraction' in d
          ? { type: 'fraction' as const, value: d.fraction }
          : { type: 'height' as const, value: d.height };
    if (detent.type !== parsed.type) return;
    const pValue = parsed.value;
    const dValue = detent.value;
    const dist = Math.abs(dValue - pValue);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestIndex = i;
    }
  });
  return nearestIndex;
}

// #endregion

/**
 * iOS implementation of `BottomSheet` using native SwiftUI sheets.
 *
 * @remarks Uses SwiftUI's `.sheet()` presentation (modal overlay).
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
    children,
  } = props;

  // Two-state pattern for animated close:
  // - isMounted: whether the native sheet tree exists in the React tree
  // - isPresented: passed to native isPresented prop (controls SwiftUI animation)
  // On close: isPresented→false (native animates out) → onIsPresentedChange fires → isMounted→false (unmount)
  // On open: isMounted→true + isPresented→true (mount + native animates in)
  const [isMounted, setIsMounted] = useState(indexProp >= 0);
  const [isPresented, setIsPresented] = useState(indexProp >= 0);
  const [currentIndex, setCurrentIndex] = useState(Math.max(indexProp, 0));
  // Ref mirrors currentIndex for use in handleDetentChange without adding it as a useCallback dep
  const currentIndexRef = useRef(currentIndex);
  // Guards fireCloseCallbacks against double-firing.
  const closedRef = useRef(indexProp < 0);

  // Stable callback refs
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const detents = useMemo<PresentationDetent[]>(() => {
    if (!snapPointsProp || snapPointsProp.length === 0) return ['medium', 'large'];
    return snapPointsProp.map(snapPointToDetent);
  }, [snapPointsProp]);

  const selectedDetent = detents[currentIndex] ?? detents[0];
  const fitToContents = enableDynamicSizing && (!snapPointsProp || snapPointsProp.length === 0);
  const internalContextValue = useMemo(() => ({ fitToContents }), [fitToContents]);

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
      setIsPresented(false);
      fireCloseCallbacks();
    } else if (indexProp >= 0) {
      closedRef.current = false;
      setIsMounted(true);
      setIsPresented(true);
      const clampedIndex = Math.min(indexProp, detents.length - 1);
      setCurrentIndex(clampedIndex);
      currentIndexRef.current = clampedIndex;
    }
  }, [indexProp, detents.length, fireCloseCallbacks]);

  const handlePresentedChange = useCallback(
    (presented: boolean) => {
      if (!presented) {
        setIsPresented(false);
        setIsMounted(false);
        fireCloseCallbacks();
      }
    },
    [fireCloseCallbacks]
  );

  const handleDetentChange = useCallback(
    (detent: PresentationDetent) => {
      const newIndex = findDetentIndex(detents, detent);
      if (newIndex >= 0 && newIndex !== currentIndexRef.current) {
        currentIndexRef.current = newIndex;
        setCurrentIndex(newIndex);
        onChangeRef.current?.(newIndex);
      }
    },
    [detents]
  );

  const methods: BottomSheetMethods = useMemo(() => {
    const snapToIndex = (index: number) => {
      if (index === -1) {
        setIsPresented(false);
        fireCloseCallbacks();
        return;
      }
      const clampedIndex = Math.min(Math.max(index, 0), detents.length - 1);
      closedRef.current = false;
      setIsMounted(true);
      setIsPresented(true);
      currentIndexRef.current = clampedIndex;
      setCurrentIndex(clampedIndex);
      onChangeRef.current?.(clampedIndex);
    };

    // Fire close callbacks immediately: the native `onIsPresentedChange` event is
    // suppressed when JS drives the state change (the Swift layer guards against
    // the feedback loop), so we can't rely on handlePresentedChange here. The
    // closedRef guard inside fireCloseCallbacks prevents double-firing if a
    // native user-dismiss event also arrives during the animation.
    const close = () => {
      setIsPresented(false);
      fireCloseCallbacks();
    };

    return {
      snapToIndex,
      snapToPosition: (position: string | number) =>
        snapToIndex(findNearestDetentIndex(detents, position)),
      expand: () => snapToIndex(detents.length - 1),
      collapse: () => snapToIndex(0),
      close,
      forceClose: close,
      present: () => snapToIndex(0),
      dismiss: close,
    };
  }, [detents, fireCloseCallbacks]);

  useImperativeHandle(ref, () => methods, [methods]);

  const modifiers = useMemo(
    () => [
      ...(fitToContents
        ? []
        : [
            presentationDetents(detents, {
              selection: selectedDetent,
              onSelectionChange: handleDetentChange,
            }),
          ]),
      presentationDragIndicator(handleComponent === null ? 'hidden' : 'visible'),
      interactiveDismissDisabled(!enablePanDownToClose),
    ],
    [
      fitToContents,
      detents,
      selectedDetent,
      handleDetentChange,
      handleComponent,
      enablePanDownToClose,
    ]
  );

  if (!isMounted) {
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
          <NativeBottomSheet
            isPresented={isPresented}
            onIsPresentedChange={handlePresentedChange}
            fitToContents={fitToContents}>
            <Group modifiers={modifiers}>
              <RNHostView matchContents={fitToContents}>
                {/* paddingTop compensates for tighter spacing between native drag indicator and content
                    compared to gorhom's handle. flex:1 fills snap point height; omitted for fitToContents
                    so RNHostView can measure natural content height. */}
                <View
                  style={
                    fitToContents
                      ? { paddingTop: handleComponent !== null ? 16 : 0 }
                      : { flex: 1, paddingTop: handleComponent !== null ? 16 : 0 }
                  }>
                  {children}
                </View>
              </RNHostView>
            </Group>
          </NativeBottomSheet>
        </Host>
      </BottomSheetContext.Provider>
    </BottomSheetInternalContext.Provider>
  );
}
