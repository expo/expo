import { mergeClasses } from '@expo/styleguide';
import { ChevronDownIcon } from '@expo/styleguide-icons/outline/ChevronDownIcon';
import { autoUpdate, computePosition, flip, offset, shift, size } from '@floating-ui/dom';
import {
  isValidElement,
  type PointerEvent,
  type PropsWithChildren,
  type ReactNode,
  useEffect,
  useId,
  useRef,
} from 'react';

import { CODE } from '~/ui/components/Text';

const INLINE_TYPE_MAX_LENGTH = 60;
const HOVER_OPEN_DELAY_MS = 150;
const HOVER_CLOSE_DELAY_MS = 200;
const VIEWPORT_PADDING = 8;

export function getNodeText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return '';
  }
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(getNodeText).join('');
  }
  if (isValidElement<{ children?: ReactNode; name?: unknown; type?: unknown }>(node)) {
    const { children, name, type } = node.props;
    if (children === undefined && typeof name === 'string') {
      return name + (type === 'array' ? '[]' : '');
    }
    return getNodeText(children);
  }
  return '';
}

export function isLongType(text: string) {
  return text.includes('\n') || text.length > INLINE_TYPE_MAX_LENGTH;
}

type Props = PropsWithChildren<{
  text: string;
}>;

export function APITypePopover({ text, children }: Props) {
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pinnedRef = useRef(false);

  useEffect(() => {
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) {
      return;
    }
    let stopPositioning: (() => void) | undefined;
    const onToggle = (event: Event) => {
      if ((event as ToggleEvent).newState !== 'open') {
        pinnedRef.current = false;
        stopPositioning?.();
        stopPositioning = undefined;
        return;
      }
      stopPositioning = autoUpdate(trigger, panel, () => {
        void computePosition(trigger, panel, {
          strategy: 'fixed',
          placement: 'bottom-end',
          middleware: [
            offset(6),
            flip({ padding: VIEWPORT_PADDING }),
            shift({ padding: VIEWPORT_PADDING }),
            size({
              padding: VIEWPORT_PADDING,
              apply({ availableHeight }) {
                panel.style.maxHeight = `${Math.max(160, availableHeight)}px`;
              },
            }),
          ],
        }).then(({ x, y }) => {
          panel.style.left = `${x}px`;
          panel.style.top = `${y}px`;
        });
      });
    };
    panel.addEventListener('toggle', onToggle);
    return () => {
      panel.removeEventListener('toggle', onToggle);
      stopPositioning?.();
      clearTimeout(timerRef.current);
    };
  }, []);

  const schedule = (action: 'show' | 'hide', delay: number) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) {
        return;
      }
      const isOpen = panel.matches(':popover-open');
      if (action === 'show' && !isOpen) {
        panel.showPopover();
      }
      if (action === 'hide' && isOpen && !pinnedRef.current) {
        panel.hidePopover();
      }
    }, delay);
  };

  const onPointerEnter = (event: PointerEvent) => {
    if (event.pointerType === 'mouse') {
      schedule('show', HOVER_OPEN_DELAY_MS);
    }
  };

  const onPointerLeave = (event: PointerEvent) => {
    if (event.pointerType === 'mouse') {
      schedule('hide', HOVER_CLOSE_DELAY_MS);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        popoverTarget={panelId}
        popoverTargetAction="show"
        data-md="skip"
        onClick={() => {
          pinnedRef.current = true;
        }}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        className="group inline-flex max-w-88 min-w-0 cursor-pointer rounded-md focus-visible:outline-2 focus-visible:outline-offset-1">
        <CODE className="flex min-w-0 items-center gap-1 text-default group-hover:bg-element">
          <span className="truncate">{text.replace(/\s+/g, ' ').trim()}</span>
          <ChevronDownIcon aria-hidden="true" className="icon-xs shrink-0 text-icon-tertiary" />
        </CODE>
      </button>
      <div
        ref={panelRef}
        id={panelId}
        popover="auto"
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        className={mergeClasses(
          'inset-auto m-0 w-max max-w-[min(40rem,calc(100vw-1rem))] overflow-auto rounded-lg border border-default bg-default p-2 text-left shadow-md',
          '[&_code]:border-0 [&_code]:bg-transparent'
        )}>
        {children}
      </div>
    </>
  );
}
