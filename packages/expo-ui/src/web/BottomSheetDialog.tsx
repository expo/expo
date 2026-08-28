import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type SyntheticEvent,
} from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { createWebComponent, css } from '../universal/webUtils';

export const BOTTOM_SHEET_TEST_IDS = {
  panel: 'expo-ui-bottom-sheet',
  overlay: 'expo-ui-bottom-sheet-overlay',
  handle: 'expo-ui-bottom-sheet-handle',
} as const;

const DRAG_THRESHOLD_PX = 8;
const CLOSE_HEIGHT_PX = 48;
const ENTER_MS = 300;
const SHEET_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
const REST_TRANSFORM = 'translateY(0)';
const HIDDEN_TRANSFORM = 'translateY(100%)';
const SHEET_IN = `expo-ui-sheet-in ${ENTER_MS}ms ${SHEET_EASE} both`;
const SHEET_OUT = `expo-ui-sheet-out ${ENTER_MS}ms ${SHEET_EASE} forwards`;
const OVERLAY_IN = `expo-ui-overlay-in ${ENTER_MS}ms ease-out both`;
const OVERLAY_OUT = `expo-ui-overlay-out ${ENTER_MS}ms ease-out forwards`;

const Dialog = createWebComponent('dialog');

export type BottomSheetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dismissible?: boolean;
  showHandle?: boolean;
  /** Pixel height for snap-point sheets. Omit to size to content. */
  height?: number;
  /** Close when a drag ends below this height. Defaults to a small px threshold. */
  minSnapHeight?: number;
  /** Called after a drag that did not dismiss, with the predicted pixel height. */
  onDragEnd?: (height: number) => void;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  accessibleTitle?: string;
  innerTestID?: string;
  bodyStyle?: StyleProp<ViewStyle>;
};

type DragSession = {
  pointerId: number;
  startY: number;
  startHeight: number;
  active: boolean;
};

function asHTMLElement(value: unknown): HTMLElement | null {
  return value instanceof HTMLElement ? value : null;
}

function asHTMLDialogElement(value: unknown): HTMLDialogElement | null {
  return value instanceof HTMLDialogElement ? value : null;
}

function isScrollableY(el: HTMLElement): boolean {
  const { overflowY } = getComputedStyle(el);
  if (overflowY !== 'auto' && overflowY !== 'scroll' && overflowY !== 'overlay') {
    return false;
  }
  return el.scrollHeight > el.clientHeight + 1;
}

function findScrollableAncestor(
  target: EventTarget | null,
  root: HTMLElement | null
): HTMLElement | null {
  if (!(target instanceof HTMLElement) || !root) return null;
  let el: HTMLElement | null = target;
  while (el && el !== root) {
    if (isScrollableY(el)) return el;
    el = el.parentElement;
  }
  return null;
}

function isDialogOpen(dialog: HTMLDialogElement) {
  return typeof dialog.open === 'boolean' ? dialog.open : dialog.hasAttribute('open');
}

function openDialog(dialog: HTMLDialogElement) {
  if (typeof dialog.showModal === 'function') {
    dialog.showModal();
    return;
  }
  dialog.setAttribute('open', '');
}

function closeDialog(dialog: HTMLDialogElement) {
  if (typeof dialog.close === 'function') {
    dialog.close();
    return;
  }
  dialog.removeAttribute('open');
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
}

const HANDLE_ON_LIGHT = 'rgba(60, 60, 67, 0.3)';
const HANDLE_ON_DARK = 'rgba(235, 235, 245, 0.55)';

function isDarkCssColor(color: unknown): boolean {
  if (typeof color !== 'string') return false;
  const value = color.trim().toLowerCase();
  if (value === 'black') return true;
  if (value === 'white' || value === 'transparent') return false;
  const hex = value.match(/^#([0-9a-f]{3,8})$/);
  if (hex?.[1]) {
    let digits = hex[1];
    if (digits.length === 3 || digits.length === 4) {
      digits = [...digits].map((ch) => ch + ch).join('');
    }
    const r = parseInt(digits.slice(0, 2), 16);
    const g = parseInt(digits.slice(2, 4), 16);
    const b = parseInt(digits.slice(4, 6), 16);
    return r * 299 + g * 587 + b * 114 < 140000;
  }
  const rgb = value.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
  if (!rgb) return false;
  const r = Number(rgb[1]);
  const g = Number(rgb[2]);
  const b = Number(rgb[3]);
  return r * 299 + g * 587 + b * 114 < 140000;
}

const sheetCss = css`
  [data-expo-ui-bottom-sheet] {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100dvh;
    max-width: none;
    max-height: none;
    margin: 0;
    padding: 0;
    border: none;
    background: transparent;
    overflow: hidden;
  }
  [data-expo-ui-bottom-sheet]::backdrop {
    background: transparent;
  }
  @keyframes expo-ui-sheet-in {
    from {
      transform: ${HIDDEN_TRANSFORM};
    }
    to {
      transform: ${REST_TRANSFORM};
    }
  }
  @keyframes expo-ui-sheet-out {
    from {
      transform: ${REST_TRANSFORM};
    }
    to {
      transform: ${HIDDEN_TRANSFORM};
    }
  }
  @keyframes expo-ui-overlay-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  @keyframes expo-ui-overlay-out {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
  [data-expo-ui-bottom-sheet-panel] {
    transform: ${REST_TRANSFORM};
    max-height: 85dvh;
  }
  [data-expo-ui-bottom-sheet-panel][data-sized='true'] {
    max-height: 100dvh;
  }
  [data-expo-ui-bottom-sheet-handle] {
    cursor: grab;
    touch-action: none;
  }
  [data-expo-ui-bottom-sheet-handle][data-grabbing='true'] {
    cursor: grabbing;
  }
`;

type BodyScrollLock = {
  count: number;
  overflow: string;
  position: string;
  top: string;
  width: string;
  scrollY: number;
};

let bodyScrollLock: BodyScrollLock | null = null;

function lockBodyScroll() {
  if (bodyScrollLock) {
    bodyScrollLock.count += 1;
    return unlockBodyScroll;
  }
  const scrollY = window.scrollY;
  bodyScrollLock = {
    count: 1,
    overflow: document.body.style.overflow,
    position: document.body.style.position,
    top: document.body.style.top,
    width: document.body.style.width,
    scrollY,
  };
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = '100%';
  return unlockBodyScroll;
}

function unlockBodyScroll() {
  if (!bodyScrollLock) return;
  bodyScrollLock.count -= 1;
  if (bodyScrollLock.count > 0) return;
  const { overflow, position, top, width, scrollY } = bodyScrollLock;
  bodyScrollLock = null;
  document.body.style.overflow = overflow;
  document.body.style.position = position;
  document.body.style.top = top;
  document.body.style.width = width;
  if (scrollY) {
    window.scrollTo(0, scrollY);
  }
}

/**
 * Web-only bottom sheet built on the HTML dialog element.
 * Shared by the community and universal BottomSheet web implementations.
 */
export function BottomSheetDialog({
  open,
  onOpenChange,
  dismissible = true,
  showHandle = true,
  height,
  minSnapHeight,
  onDragEnd,
  style,
  children,
  accessibleTitle = 'Bottom sheet',
  innerTestID,
  bodyStyle,
}: BottomSheetDialogProps) {
  const dialogRef = useRef(null);
  const sheetRef = useRef(null);
  const overlayRef = useRef(null);
  const handleRef = useRef(null);
  const dragRef = useRef<DragSession | null>(null);
  const [mounted, setMounted] = useState(open);
  const [dragHeight, setDragHeight] = useState<number | null>(null);

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  useLayoutEffect(() => {
    const dialog = asHTMLDialogElement(dialogRef.current);
    const sheet = asHTMLElement(sheetRef.current);
    const overlay = asHTMLElement(overlayRef.current);
    if (!dialog || !sheet || !overlay || !mounted) return;

    if (open) {
      if (!isDialogOpen(dialog)) openDialog(dialog);
      if (prefersReducedMotion()) {
        sheet.style.animation = 'none';
        overlay.style.animation = 'none';
        sheet.style.transform = REST_TRANSFORM;
        overlay.style.opacity = '1';
        return;
      }
      sheet.style.animation = 'none';
      overlay.style.animation = 'none';
      sheet.style.transform = HIDDEN_TRANSFORM;
      overlay.style.opacity = '0';
      sheet.getBoundingClientRect();
      sheet.style.animation = SHEET_IN;
      overlay.style.animation = OVERLAY_IN;
      return;
    }

    if (!isDialogOpen(dialog)) return;
    if (prefersReducedMotion()) {
      closeDialog(dialog);
      return;
    }
    sheet.style.animation = SHEET_OUT;
    overlay.style.animation = OVERLAY_OUT;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      closeDialog(dialog);
    };
    const onEnd = (event: AnimationEvent) => {
      if (event.target === sheet) finish();
    };
    sheet.addEventListener('animationend', onEnd);
    const timeout = window.setTimeout(finish, ENTER_MS + 100);
    return () => {
      sheet.removeEventListener('animationend', onEnd);
      window.clearTimeout(timeout);
    };
  }, [open, mounted]);

  useEffect(() => {
    if (!open) return;
    return lockBodyScroll();
  }, [open]);

  const commitClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open || !mounted || !dismissible) return;
    const overlay = asHTMLElement(overlayRef.current);
    if (!overlay) return;
    overlay.addEventListener('click', commitClose);
    return () => overlay.removeEventListener('click', commitClose);
  }, [open, mounted, dismissible, commitClose]);

  const resolveStartHeight = useCallback(() => {
    if (height != null) return height;
    return asHTMLElement(sheetRef.current)?.getBoundingClientRect().height ?? 0;
  }, [height]);

  const commitCloseRef = useRef(commitClose);
  const onDragEndRef = useRef(onDragEnd);
  const resolveStartHeightRef = useRef(resolveStartHeight);
  const minSnapHeightRef = useRef(minSnapHeight);
  const dismissibleRef = useRef(dismissible);
  commitCloseRef.current = commitClose;
  onDragEndRef.current = onDragEnd;
  resolveStartHeightRef.current = resolveStartHeight;
  minSnapHeightRef.current = minSnapHeight;
  dismissibleRef.current = dismissible;

  useEffect(() => {
    if (!open || !mounted) return;
    const sheet = asHTMLElement(sheetRef.current);
    if (!sheet) return;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const handle = asHTMLElement(handleRef.current);
      const fromHandle = handle?.contains(event.target as Node) ?? false;
      if (!fromHandle) {
        const scrollable = findScrollableAncestor(event.target, sheet);
        if (scrollable && scrollable.scrollTop > 0) return;
      }
      dragRef.current = {
        pointerId: event.pointerId,
        startY: event.clientY,
        startHeight: resolveStartHeightRef.current(),
        active: false,
      };
      if (typeof sheet.setPointerCapture === 'function') {
        try {
          sheet.setPointerCapture(event.pointerId);
        } catch {}
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const deltaY = event.clientY - drag.startY;
      if (!drag.active) {
        if (Math.abs(deltaY) < DRAG_THRESHOLD_PX) return;
        drag.active = true;
      }
      event.preventDefault();
      const maxHeight = window.innerHeight;
      setDragHeight(Math.min(maxHeight, Math.max(0, drag.startHeight - deltaY)));
    };

    const onPointerUp = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      dragRef.current = null;
      if (!drag.active) {
        setDragHeight(null);
        return;
      }
      const predicted = Math.max(0, drag.startHeight - (event.clientY - drag.startY));
      setDragHeight(null);
      const closeBelow =
        minSnapHeightRef.current != null
          ? Math.max(0, minSnapHeightRef.current - CLOSE_HEIGHT_PX)
          : CLOSE_HEIGHT_PX;
      if (dismissibleRef.current && predicted < closeBelow) {
        commitCloseRef.current();
        return;
      }
      onDragEndRef.current?.(predicted);
    };

    const abortDrag = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      dragRef.current = null;
      setDragHeight(null);
    };

    sheet.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', abortDrag);
    sheet.addEventListener('lostpointercapture', abortDrag);
    return () => {
      sheet.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', abortDrag);
      sheet.removeEventListener('lostpointercapture', abortDrag);
      dragRef.current = null;
      setDragHeight(null);
    };
  }, [open, mounted]);

  const onCancel = useCallback(
    (event: SyntheticEvent) => {
      event.preventDefault();
      if (!dismissible) return;
      commitClose();
    },
    [commitClose, dismissible]
  );

  if (!mounted) return null;

  const dataState = open ? 'open' : 'closed';
  const renderedHeight = dragHeight ?? height;
  const dragging = dragHeight != null;
  const flatStyle = StyleSheet.flatten(style);
  const sheetBackground = flatStyle?.backgroundColor ?? styles.sheet.backgroundColor;
  const handleBackground = isDarkCssColor(sheetBackground) ? HANDLE_ON_DARK : HANDLE_ON_LIGHT;

  return (
    <Dialog
      ref={dialogRef}
      aria-label={accessibleTitle}
      dataSet={{ expoUiBottomSheet: '', state: dataState }}
      onCancel={onCancel}>
      <style href="expo-ui-bottom-sheet" precedence="expo-ui">
        {sheetCss}
      </style>
      <View
        ref={overlayRef}
        testID={BOTTOM_SHEET_TEST_IDS.overlay}
        dataSet={{ state: dataState }}
        style={styles.overlay}
      />
      <View
        ref={sheetRef}
        testID={BOTTOM_SHEET_TEST_IDS.panel}
        dataSet={{
          expoUiBottomSheetPanel: '',
          state: dataState,
          sized: renderedHeight != null ? 'true' : undefined,
        }}
        style={[
          styles.sheet,
          style,
          renderedHeight != null && { height: renderedHeight },
          renderedHeight != null && !dragging && styles.sheetHeightTransition,
        ]}>
        {showHandle ? (
          <View
            ref={handleRef}
            testID={BOTTOM_SHEET_TEST_IDS.handle}
            dataSet={{ expoUiBottomSheetHandle: '', grabbing: dragging ? 'true' : undefined }}
            style={[styles.handle, { backgroundColor: handleBackground }]}
          />
        ) : null}
        <View
          testID={innerTestID}
          style={[styles.body, renderedHeight != null && styles.bodyFlex, bodyStyle]}>
          {children}
        </View>
      </View>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 'env(safe-area-inset-bottom)',
    zIndex: 1,
  },
  sheetHeightTransition: {
    transitionDuration: `${ENTER_MS}ms`,
    transitionProperty: 'height',
    transitionTimingFunction: 'ease',
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 100,
    marginTop: 8,
    marginBottom: 4,
    alignSelf: 'center',
    flexShrink: 0,
  },
  body: {
    minHeight: 0,
    flexShrink: 1,
    overflowY: 'auto',
  },
  bodyFlex: {
    flex: 1,
  },
});
