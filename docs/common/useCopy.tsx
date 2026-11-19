import { useState } from 'react';

export function useCopy(text: string | (() => string)) {
  const [copiedIsVisible, setCopiedIsVisible] = useState(false);

  async function onCopyAsync() {
    const copy = (await import('clipboard-copy')).default;
    await copy(typeof text === 'function' ? text() : text);
    if (!copiedIsVisible) {
      setCopiedIsVisible(true);
      setTimeout(() => {
        setCopiedIsVisible(false);
      }, 1500);
    }
  }

  return { copiedIsVisible, onCopyAsync };
}
