import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Drawer } from 'vaul';

import { BottomSheetContext, BottomSheetInternalContext } from './context';
import type { BottomSheetMethods, BottomSheetProps } from './types';
import { parseSnapPoint } from './types';

export { useBottomSheet } from './context';

function resolveSnapPointPx(point: string | number, containerHeight: number): number {
  const parsed = parseSnapPoint(point);
  return parsed.type === 'fraction' ? Math.round(containerHeight * parsed.value) : parsed.value;
}

// Always true on web: BottomSheetView strips flex styles so vaul can measure content naturally.
const internalContextValue = { fitToContents: true };

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  zIndex: 999,
};

const defaultContentStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  padding: '0 16px',
  backgroundColor: '#fff',
  borderTopLeftRadius: 10,
  borderTopRightRadius: 10,
  zIndex: 1000,
};

/**
 * Web implementation of `BottomSheet` using vaul.
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
  } = props;

  const { height: windowHeight } = useWindowDimensions();

  const hasSnapPoints = snapPointsProp != null && snapPointsProp.length > 0;
  const snapHeights = useMemo(() => {
    if (!hasSnapPoints) return [];
    return snapPointsProp!.map((p) => resolveSnapPointPx(p, windowHeight));
  }, [snapPointsProp, hasSnapPoints, windowHeight]);

  const [isOpen, setIsOpen] = useState(indexProp >= 0);
  // Drives currentHeight for snap-point sheets. Vaul doesn't use snap points —
  // we control the content div height ourselves with CSS transition.
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

    // Fire close callbacks immediately: vaul's `onOpenChange` is not guaranteed
    // to fire when `open` is driven externally, so we don't rely on handleOpenChange
    // here. The closedRef guard inside fireCloseCallbacks prevents double-firing
    // if a user-dismiss event also arrives during the animation.
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
  const innerStyle: React.CSSProperties | undefined =
    currentHeight != null
      ? { overflowY: 'auto', height: currentHeight, transition: 'height 0.3s ease' }
      : undefined;

  const mergedContentStyle = useMemo<React.CSSProperties>(() => {
    const flat = StyleSheet.flatten(backgroundStyle);
    return flat
      ? { ...defaultContentStyle, ...(flat as React.CSSProperties) }
      : defaultContentStyle;
  }, [backgroundStyle]);

  return (
    <BottomSheetInternalContext.Provider value={internalContextValue}>
      <BottomSheetContext.Provider value={methods}>
        <Drawer.Root
          open={isOpen}
          onOpenChange={handleOpenChange}
          dismissible={enablePanDownToClose}>
          <Drawer.Overlay style={overlayStyle} />
          <Drawer.Portal>
            <Drawer.Content style={mergedContentStyle}>
              {handleComponent !== null && <Drawer.Handle />}
              <div style={innerStyle}>{children}</div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      </BottomSheetContext.Provider>
    </BottomSheetInternalContext.Provider>
  );
}
