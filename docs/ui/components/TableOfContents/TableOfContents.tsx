import { spacing } from '@expo/styleguide-base';
import { useMemo } from 'react';

import { HeadingEntry, useHeadingsObserver } from './useHeadingObserver';

import { LayoutScroll, useAutoScrollTo } from '~/ui/components/Layout';
import { A, CALLOUT } from '~/ui/components/Text';

type TableOfContentsLinkProps = HeadingEntry & {
  isActive?: boolean;
};

export function TableOfContents() {
  const { headings, activeId } = useHeadingsObserver();
  const autoScroll = useAutoScrollTo(activeId ? `[data-toc-id="${activeId}"]` : '');

  return (
    <LayoutScroll ref={autoScroll.ref}>
      <nav className="block w-full p-8">
        <CALLOUT className="mb-1.5 mt-4" weight="medium">
          On this page
        </CALLOUT>
        <ul className="list-none">
          {headings.map(heading => (
            <li key={`heading-${heading.id}`} data-toc-id={heading.id}>
              <TableOfContentsLink {...heading} isActive={heading.id === activeId} />
            </li>
          ))}
        </ul>
      </nav>
    </LayoutScroll>
  );
}

function TableOfContentsLink({ id, element, isActive }: TableOfContentsLinkProps) {
  const info = useMemo(() => getHeadingInfo(element), [element]);

  return (
    <A style={getHeadingIndent(element)} className="block py-1.5" href={`#${id}`}>
      <CALLOUT weight={isActive ? 'medium' : 'regular'} tag="span">
        {info.text}
      </CALLOUT>
    </A>
  );
}

export function getHeadingIndent(heading: HTMLHeadingElement) {
  const level = Math.max(Number(heading.tagName.slice(1)) - 2, 0);
  return { paddingLeft: spacing[2] * level };
}

/**
 * Parse the heading information from an HTML heading element.
 * If it contains parenthesis, we try to extract the function name only.
 */
export function getHeadingInfo(heading: HTMLHeadingElement) {
  const text = heading.textContent || '';
  const functionOpenChar = text.indexOf('(');

  return functionOpenChar >= 0 && text[functionOpenChar - 1].trim()
    ? { type: 'code', text: text.slice(0, functionOpenChar) }
    : { type: 'text', text };
}
