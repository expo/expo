import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type SyntheticEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { createWebComponent, css } from '../universal/webUtils';

export const BOTTOM_SHEET_TEST_IDS = {
  panel: 'expo-ui-bottom-sheet',
  overlay: 'expo-ui-bottom-sheet-overlay',
  handle: 'expo-ui-bottom-sheet-handle',
} as const;

const DRAG_THRESHOLD_PX = 8;
const CLOSE_HEIGHT_PX = 48;
const CLOSE_HEIGHT_FRACTION = 0.5;
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
  /**
   * Lowest snap height in pixels.
   * A drag closes once it ends far enough below this value (a small px margin).
   * Without it, a content-sized sheet closes when the drag ends below half
   * its start height.
   */
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
  lastY: number;
  startHeight: number;
  active: boolean;
};

type DragVisual = {
  live: boolean;
  translateY: number;
  height: number | null;
};

function dismissBelowHeight(startHeight: number, minSnapHeight?: number): number {
  if (minSnapHeight != null) {
    return Math.max(0, minSnapHeight - CLOSE_HEIGHT_PX);
  }
  return startHeight * CLOSE_HEIGHT_FRACTION;
}

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

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return target.closest('button, a, input, textarea, select, [role="button"]') != null;
}

function isDialogOpen(dialog: HTMLDialogElement) {
  return typeof dialog.open === 'boolean' ? dialog.open : dialog.hasAttribute('open');
}

function openDialog(dialog: HTMLDialogElement) {
  // show(), not showModal(): the HTML spec makes everything outside a modal
  // dialog inert, so an overlay that portals to <body> — such as react-native-web's
  // Modal opened from sheet content — could never be used. The sheet provides the
  // modal experience itself: scrim, Escape, focus restore, and a background
  // `inert` that spares overlays mounted while the sheet is open.
  if (typeof dialog.show === 'function') {
    dialog.show();
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
    /* The dialog is not in the top layer. One step below react-native-web
       Modal's 9999, so a Modal opened from sheet content always paints above
       the sheet, wherever its portal node sits in <body>. */
    z-index: 9998;
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
    touch-action: none;
    transition:
      height ${ENTER_MS}ms ${SHEET_EASE},
      transform ${ENTER_MS}ms ${SHEET_EASE};
  }
  [data-expo-ui-bottom-sheet-panel][data-sized='true'] {
    max-height: 100dvh;
  }
  [data-expo-ui-bottom-sheet-panel][data-dragging='true'] {
    transition: none;
  }
  [data-expo-ui-bottom-sheet-handle] {
    cursor: grab;
    touch-action: none;
  }
  [data-expo-ui-bottom-sheet-handle][data-grabbing='true'] {
    cursor: grabbing;
  }
  [data-expo-ui-bottom-sheet-body] {
    touch-action: pan-y;
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

const SHEET_ROOT_ATTRIBUTE = 'data-expo-ui-bottom-sheet-root';

// Reference counts per element, so stacked sheets restore `inert` correctly.
const inertLocks = new Map<HTMLElement, number>();

// The dialog is not modal, so the browser does not make the rest of the page
// inert. Do it for the elements already in <body> when the sheet opens.
// Elements appended later — such as a react-native-web Modal opened from sheet
// content — stay interactive on purpose. Sheet roots are skipped so two open
// sheets cannot make each other inert.
function lockBackgroundInert() {
  const locked: HTMLElement[] = [];
  for (const child of Array.from(document.body.children)) {
    if (!(child instanceof HTMLElement) || child.hasAttribute(SHEET_ROOT_ATTRIBUTE)) continue;
    // An element without element children hosts no background content.
    // react-native-web's Modal appends its empty portal <div> when the Modal
    // mounts — even hidden inside sheet content — and fills it when the Modal
    // becomes visible; `inert` here would disable that Modal.
    if (child.childElementCount === 0) continue;
    const count = inertLocks.get(child) ?? 0;
    if (count === 0) {
      // The app made this element inert itself; leave it alone.
      if (child.inert) continue;
      child.inert = true;
    }
    inertLocks.set(child, count + 1);
    locked.push(child);
  }
  return () => {
    for (const el of locked) {
      const count = inertLocks.get(el) ?? 0;
      if (count <= 1) {
        inertLocks.delete(el);
        el.inert = false;
      } else {
        inertLocks.set(el, count - 1);
      }
    }
  };
}

// Open sheet dialogs, oldest first. Only the top-most one reacts to Escape.
const openSheetDialogs: HTMLDialogElement[] = [];

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
  const playedEnterRef = useRef(false);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(open);
  const [dragVisual, setDragVisual] = useState<DragVisual | null>(null);

  // The dialog renders in a portal under <body>. In the React tree it can sit
  // inside a transformed or z-indexed ancestor, which would clip a non-top-layer
  // fixed element; under <body> its z-index competes with other overlays directly.
  const containerRef = useRef<HTMLElement | null>(null);
  if (containerRef.current == null && typeof document !== 'undefined') {
    const container = document.createElement('div');
    container.setAttribute(SHEET_ROOT_ATTRIBUTE, '');
    containerRef.current = container;
  }

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    document.body.appendChild(container);
    return () => {
      container.remove();
    };
  }, []);

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  const restoreFocus = useCallback(() => {
    const dialog = asHTMLDialogElement(dialogRef.current);
    const target = previouslyFocusedRef.current;
    previouslyFocusedRef.current = null;
    if (!target || !target.isConnected) return;
    const active = document.activeElement;
    // Keep focus where the user put it when it is not being lost with the sheet.
    if (active && active !== document.body && !(dialog?.contains(active) ?? false)) return;
    target.focus();
  }, []);

  useLayoutEffect(() => {
    const dialog = asHTMLDialogElement(dialogRef.current);
    const sheet = asHTMLElement(sheetRef.current);
    const overlay = asHTMLElement(overlayRef.current);
    if (!dialog || !sheet || !overlay || !mounted) return;

    if (open) {
      if (!isDialogOpen(dialog)) {
        previouslyFocusedRef.current =
          document.activeElement instanceof HTMLElement ? document.activeElement : null;
        openDialog(dialog);
      }
      if (playedEnterRef.current) return;
      playedEnterRef.current = true;
      if (prefersReducedMotion()) {
        sheet.style.animation = 'none';
        overlay.style.animation = 'none';
        sheet.style.transition = 'none';
        sheet.style.transform = REST_TRANSFORM;
        overlay.style.opacity = '1';
        return;
      }
      sheet.style.animation = 'none';
      overlay.style.animation = 'none';
      sheet.style.transition = 'none';
      sheet.style.transform = HIDDEN_TRANSFORM;
      overlay.style.opacity = '0';
      sheet.getBoundingClientRect();
      sheet.style.animation = SHEET_IN;
      overlay.style.animation = OVERLAY_IN;
      sheet.style.transition = '';
      return;
    }

    playedEnterRef.current = false;
    if (!isDialogOpen(dialog)) return;
    if (prefersReducedMotion()) {
      closeDialog(dialog);
      restoreFocus();
      return;
    }
    sheet.style.animation = SHEET_OUT;
    overlay.style.animation = OVERLAY_OUT;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      closeDialog(dialog);
      restoreFocus();
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
  }, [open, mounted, restoreFocus]);

  useEffect(() => {
    if (!open) return;
    return lockBodyScroll();
  }, [open]);

  useEffect(() => {
    if (!open || !mounted) return;
    return lockBackgroundInert();
  }, [open, mounted]);

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

  // A non-modal dialog gets no `cancel` event, so Escape is handled here.
  useEffect(() => {
    if (!open || !mounted) return;
    const dialog = asHTMLDialogElement(dialogRef.current);
    if (!dialog) return;
    openSheetDialogs.push(dialog);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      if (openSheetDialogs[openSheetDialogs.length - 1] !== dialog) return;
      const target = event.target;
      // An overlay above the sheet (a react-native-web Modal traps focus inside
      // itself) owns Escape; the sheet only reacts when the key lands in the
      // sheet or on the body.
      if (target instanceof Node && target !== document.body && !dialog.contains(target)) return;
      event.preventDefault();
      if (!dismissibleRef.current) return;
      commitCloseRef.current();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      const index = openSheetDialogs.indexOf(dialog);
      if (index !== -1) openSheetDialogs.splice(index, 1);
    };
  }, [open, mounted]);

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
        if (isInteractiveTarget(event.target)) return;
      }
      dragRef.current = {
        pointerId: event.pointerId,
        startY: event.clientY,
        lastY: event.clientY,
        startHeight: resolveStartHeightRef.current(),
        active: false,
      };
    };

    const capturePointer = (pointerId: number) => {
      if (typeof sheet.setPointerCapture !== 'function') return;
      try {
        sheet.setPointerCapture(pointerId);
      } catch {}
    };

    const onPointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const deltaY = event.clientY - drag.startY;
      drag.lastY = event.clientY;
      if (!drag.active) {
        if (Math.abs(deltaY) < DRAG_THRESHOLD_PX) return;
        drag.active = true;
        capturePointer(event.pointerId);
      }
      event.preventDefault();
      const maxHeight = window.innerHeight;
      const predicted = Math.min(maxHeight, Math.max(0, drag.startHeight - deltaY));
      if (predicted >= drag.startHeight) {
        setDragVisual({ live: true, translateY: 0, height: predicted });
      } else {
        setDragVisual({
          live: true,
          translateY: drag.startHeight - predicted,
          height: null,
        });
      }
    };

    const finishDrag = (clientY: number) => {
      const drag = dragRef.current;
      if (!drag) return;
      dragRef.current = null;
      if (!drag.active) {
        setDragVisual(null);
        return;
      }
      const predicted = Math.max(0, drag.startHeight - (clientY - drag.startY));
      const closeBelow = dismissBelowHeight(drag.startHeight, minSnapHeightRef.current);
      if (dismissibleRef.current && predicted < closeBelow) {
        // Keep the sheet short so the close animation starts from the drag position.
        setDragVisual({ live: false, translateY: 0, height: Math.max(predicted, 1) });
        commitCloseRef.current();
        return;
      }
      setDragVisual(null);
      onDragEndRef.current?.(predicted);
    };

    const onPointerUp = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      finishDrag(event.clientY);
    };

    const abortDrag = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      dragRef.current = null;
      setDragVisual(null);
    };

    const onLostPointerCapture = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      // Capture is released after pointerup. Some browsers fire this before the
      // bubbling window pointerup, so aborting here skipped onDragEnd / snapping.
      if ((event.buttons ?? 0) !== 0) {
        try {
          sheet.setPointerCapture(event.pointerId);
        } catch {}
        return;
      }
      finishDrag(drag.lastY);
    };

    const windowPointerOptions = { capture: true };
    sheet.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, windowPointerOptions);
    window.addEventListener('pointerup', onPointerUp, windowPointerOptions);
    window.addEventListener('pointercancel', abortDrag, windowPointerOptions);
    sheet.addEventListener('lostpointercapture', onLostPointerCapture);
    return () => {
      sheet.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove, windowPointerOptions);
      window.removeEventListener('pointerup', onPointerUp, windowPointerOptions);
      window.removeEventListener('pointercancel', abortDrag, windowPointerOptions);
      sheet.removeEventListener('lostpointercapture', onLostPointerCapture);
      dragRef.current = null;
      setDragVisual(null);
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

  if (!mounted || !containerRef.current) return null;

  const dataState = open ? 'open' : 'closed';
  const renderedHeight = dragVisual?.height ?? height;
  const dragging = dragVisual?.live === true;
  const flatStyle = StyleSheet.flatten(style);
  const sheetBackground = flatStyle?.backgroundColor ?? styles.sheet.backgroundColor;
  const handleBackground = isDarkCssColor(sheetBackground) ? HANDLE_ON_DARK : HANDLE_ON_LIGHT;

  return createPortal(
    <Dialog
      ref={dialogRef}
      aria-label={accessibleTitle}
      aria-modal
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
          dragging: dragging ? 'true' : undefined,
        }}
        style={[
          styles.sheet,
          style,
          renderedHeight != null && { height: renderedHeight },
          dragVisual != null &&
            dragVisual.translateY > 0 && { transform: [{ translateY: dragVisual.translateY }] },
        ]}>
        {showHandle ? (
          <View
            ref={handleRef}
            dataSet={{ expoUiBottomSheetHandle: '', grabbing: dragging ? 'true' : undefined }}
            style={styles.handleHit}>
            <View
              testID={BOTTOM_SHEET_TEST_IDS.handle}
              style={[styles.handle, { backgroundColor: handleBackground }]}
            />
          </View>
        ) : null}
        <View
          testID={innerTestID}
          dataSet={{ expoUiBottomSheetBody: '' }}
          style={[styles.body, renderedHeight != null && styles.bodyFlex, bodyStyle]}>
          {children}
        </View>
      </View>
    </Dialog>,
    containerRef.current
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
  handleHit: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 2,
    flexShrink: 0,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 100,
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
