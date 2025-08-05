import { mergeClasses } from '@expo/styleguide';
import { CheckIcon } from '@expo/styleguide-icons/outline/CheckIcon';
import { ClipboardIcon } from '@expo/styleguide-icons/outline/ClipboardIcon';
import { ReactNode, useState } from 'react';

type CopyTextButtonProps = {
  children: ReactNode;
  copyText?: string;
  className?: string;
};

function extractTextFromChildren(children: ReactNode): string {
  if (typeof children === 'string') {
    return children;
  }
  if (typeof children === 'number') {
    return children.toString();
  }
  if (Array.isArray(children)) {
    return children.map(extractTextFromChildren).join('');
  }
  if (children && typeof children === 'object' && 'props' in children) {
    return extractTextFromChildren((children as any).props.children);
  }
  return '';
}

function cleanTextForCopy(text: string): string {
  return text
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s*\[[^\]]*]/g, '')
    .replace(/`/g, '')
    .replace(/-like$/g, '')
    .replace(/^Legacy\s+/g, '')
    .replace(/\s+(deprecated)$/g, '')
    .trim();
}

export function CopyTextButton({ children, copyText, className }: CopyTextButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyAsync = async () => {
    const textToCopy = copyText ?? cleanTextForCopy(extractTextFromChildren(children));

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      console.warn('Clipboard API not supported. Please copy manually:', textToCopy);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 1500);
    }
  };

  return (
    <span className={mergeClasses('group inline-flex items-center gap-1', className)}>
      <span>{children}</span>
      <button
        type="button"
        onClick={handleCopyAsync}
        className={mergeClasses(
          'rounded inline-flex items-center justify-center p-1 transition-colors',
          'hover:bg-element focus-visible:bg-element',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-link',
          copied && 'opacity-100'
        )}
        aria-label="Copy to clipboard"
        title="Copy to clipboard">
        {copied ? (
          <CheckIcon className="icon-xs text-success" />
        ) : (
          <ClipboardIcon className="icon-xs text-icon-secondary hover:text-icon-default" />
        )}
      </button>
    </span>
  );
}
