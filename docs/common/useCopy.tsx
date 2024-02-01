import { useState } from 'react';

export function useCopy(text: string) {
  const [copiedIsVisible, setCopiedIsVisible] = useState(false);

  async function onCopy() {
    const copy = (await import('clipboard-copy')).default;
    await copy(text);
    if (!copiedIsVisible) {
      setCopiedIsVisible(true);
      setTimeout(() => setCopiedIsVisible(false), 1500);
    }
  }

  return { copiedIsVisible, onCopy };
}
