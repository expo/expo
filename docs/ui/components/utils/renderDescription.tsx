import { Fragment } from 'react';

import { CODE } from '~/ui/components/Text';

/**
 * Renders inline backtick-wrapped text as <CODE> elements.
 */
export function renderDescription(text: string) {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <CODE key={i}>{part.slice(1, -1)}</CODE>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}
