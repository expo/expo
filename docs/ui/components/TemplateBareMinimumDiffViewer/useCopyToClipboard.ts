import { useState } from 'react';

const COPIED_FEEDBACK_DURATION = 1500;

export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);

  const copy = (text: string) => {
    void navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, COPIED_FEEDBACK_DURATION);
  };

  return { copied, copy };
}
