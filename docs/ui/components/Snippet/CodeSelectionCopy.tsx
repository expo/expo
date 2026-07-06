import { ClipboardIcon } from '@expo/styleguide-icons/outline/ClipboardIcon';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useIntl } from 'react-intl';

const CODE_BLOCK_SELECTOR = 'pre[data-md-lang], .diff-unified';
const COPIED_DISMISS_MS = 1200;

type Position = { top: number; left: number };

function isNodeInCodeBlock(node: Node | null) {
  const element = node instanceof Element ? node : node?.parentElement;
  const codeBlock = element?.closest(CODE_BLOCK_SELECTOR);
  return Boolean(codeBlock && !codeBlock.closest('[data-selection-copy-ignore]'));
}

function isOnCopyButton(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('[data-selection-copy]'));
}

function getCleanSelectionText(selection: Selection) {
  const container = document.createElement('div');
  for (let index = 0; index < selection.rangeCount; index++) {
    container.append(selection.getRangeAt(index).cloneContents());
  }
  for (const node of container.querySelectorAll('.code-hidden, .code-placeholder')) {
    node.remove();
  }
  const diffCells = container.querySelectorAll('.diff-code');
  if (diffCells.length > 0) {
    return Array.from(diffCells, cell => cell.textContent ?? '').join('\n');
  }
  return container.textContent ?? '';
}

function getCaretRect(node: Node | null, offset: number) {
  if (!node) {
    return null;
  }
  const range = document.createRange();
  range.setStart(node, offset);
  range.collapse(true);
  const rect = range.getClientRects().item(0) ?? range.getBoundingClientRect();
  return rect.height > 0 ? rect : null;
}

export function CodeSelectionCopy() {
  const intl = useIntl();
  const [position, setPosition] = useState<Position | null>(null);
  const [copied, setCopied] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const onMouseUp = (event: MouseEvent) => {
      if (isOnCopyButton(event.target)) {
        return;
      }
      const selection = window.getSelection();
      if (
        !selection ||
        selection.isCollapsed ||
        selection.rangeCount === 0 ||
        !selection.toString().trim()
      ) {
        setPosition(null);
        return;
      }
      if (!isNodeInCodeBlock(selection.anchorNode) && !isNodeInCodeBlock(selection.focusNode)) {
        setPosition(null);
        return;
      }
      const fallback = selection.getRangeAt(0).getBoundingClientRect();
      const startRect = getCaretRect(selection.anchorNode, selection.anchorOffset) ?? fallback;
      const endRect = getCaretRect(selection.focusNode, selection.focusOffset) ?? fallback;
      setPosition({
        top: Math.max(8, Math.min(startRect.top, endRect.top) - 40),
        left: Math.min(Math.max(60, (startRect.left + endRect.left) / 2), window.innerWidth - 60),
      });
      setCopied(false);
    };
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  useEffect(() => {
    if (!position) {
      return;
    }
    const dismiss = () => {
      setPosition(null);
    };
    const onMouseDown = (event: MouseEvent) => {
      if (!isOnCopyButton(event.target)) {
        setPosition(null);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPosition(null);
      }
    };
    const onSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        setPosition(null);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('selectionchange', onSelectionChange);
    window.addEventListener('scroll', dismiss, true);
    window.addEventListener('resize', dismiss);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('selectionchange', onSelectionChange);
      window.removeEventListener('scroll', dismiss, true);
      window.removeEventListener('resize', dismiss);
    };
  }, [position]);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setPosition(null);
      setCopied(false);
    }, COPIED_DISMISS_MS);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [copied]);

  if (!position) {
    return null;
  }

  const onCopy = () => {
    const selection = window.getSelection();
    const text = selection ? getCleanSelectionText(selection) : '';
    if (!text.trim()) {
      return;
    }
    void navigator.clipboard?.writeText(text);
    setCopied(true);
    setAnnouncement('');
    window.requestAnimationFrame(() => {
      setAnnouncement(intl.formatMessage({ id: 'codeCopied' }));
    });
  };

  return createPortal(
    <>
      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
      <button
        type="button"
        data-selection-copy
        onMouseDown={event => {
          event.preventDefault();
        }}
        onClick={onCopy}
        style={{
          position: 'fixed',
          top: position.top,
          left: position.left,
          transform: 'translateX(-50%)',
        }}
        className="z-50 inline-flex items-center gap-1.5 rounded-md border border-default bg-default px-2 py-1 text-xs text-secondary shadow-md hover:text-default cursor-pointer">
        <ClipboardIcon aria-hidden="true" className="icon-xs text-icon-secondary" />
        {intl.formatMessage({ id: copied ? 'codeCopied' : 'codeCopy' })}
      </button>
    </>,
    document.body
  );
}
