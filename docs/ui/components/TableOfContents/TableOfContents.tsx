import { css } from '@emotion/react';
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
      <nav css={containerStyle}>
        <CALLOUT css={titleStyle} weight="medium">
          On this page
        </CALLOUT>
        <ul css={listStyle}>
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
    <A css={[linkStyle, getHeadingIndent(element)]} href={`#${id}`}>
      <CALLOUT weight={isActive ? 'medium' : 'regular'} tag="span">
        {info.text}
      </CALLOUT>
    </A>
  );
}

const containerStyle = css({
  display: 'block',
  width: '100%',
  padding: spacing[8],
});

const titleStyle = css({
  marginTop: spacing[4],
  marginBottom: spacing[1.5],
});

const listStyle = css({
  listStyle: 'none',
});

const linkStyle = css({
  display: 'block',
  padding: `${spacing[1.5]}px 0`,
});

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
