import { css } from '@emotion/react';
import { spacing } from '@expo/styleguide';
import React, { useMemo } from 'react';

import { getHeadingId, useTableOfContents, TableOfContentsOptions } from './useTableOfContents';

import { A, CALLOUT } from '~/ui/components/Text';

type TableOfContentsProps = TableOfContentsOptions;
type TableOfContentsLinkProps = {
  heading: HTMLHeadingElement;
  headingId: string;
  isActive?: boolean;
};

export function TableOfContents(props: TableOfContentsProps) {
  const { headings, activeId } = useTableOfContents(props);

  return (
    <nav css={containerStyle}>
      <CALLOUT css={titleStyle} weight="medium">
        On this page
      </CALLOUT>
      <ul css={listStyle}>
        {headings.map(heading => {
          const headingId = getHeadingId(heading);
          const isActive = headingId === activeId;
          return (
            <li key={`heading-${headingId}`}>
              <TableOfContentsLink heading={heading} headingId={headingId} isActive={isActive} />
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function TableOfContentsLink({ heading, headingId, isActive }: TableOfContentsLinkProps) {
  const headingText = useMemo(() => getHeadingText(heading), [heading.textContent]);
  return (
    <A css={[linkStyle, getHeadingStyle(heading)]} href={`#${headingId}`}>
      <CALLOUT weight={isActive ? 'medium' : 'regular'} tag="span">
        {headingText}
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

function getHeadingStyle(heading: HTMLHeadingElement) {
  const level = Math.max(Number(heading.tagName.slice(1)) - 2, 0);
  return { paddingLeft: spacing[2] * level };
}

/**
 * Get the link text from the heading.
 * This only uses the function name if a heading contains code.
 * @todo revise this with proper code block styling
 */
function getHeadingText(heading: HTMLHeadingElement) {
  const text = heading.textContent || '';
  const functionChar = text.indexOf('(');
  return functionChar >= 0 ? text.slice(0, functionChar) : text;
}
