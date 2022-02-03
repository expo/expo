import { css } from '@emotion/react';
import { borderRadius, iconSize, shadows, spacing, theme } from '@expo/styleguide';
import React, { PropsWithChildren, ReactNode } from 'react';

import { HEADLINE } from '~/ui/components/Text';
import { durations } from '~/ui/foundations/durations';
import { ChevronDownIcon } from '~/ui/foundations/icons';

type CollapsibleProps = PropsWithChildren<
  Pick<HTMLDetailsElement, 'open'> & {
    title: ReactNode;
  }
>;

export function Collapsible({ title, children, ...rest }: CollapsibleProps) {
  return (
    <details css={detailsStyle} {...rest}>
      <summary css={summaryStyle}>
        <ChevronDownIcon css={markerStyle} size={iconSize.small} />
        <HEADLINE tag="span">{title}</HEADLINE>
      </summary>
      <div css={contentStyle}>{children}</div>
    </details>
  );
}

const detailsStyle = css({
  overflow: 'hidden',
  background: theme.background.default,
  border: `1px solid ${theme.border.default}`,
  borderRadius: borderRadius.medium,
  padding: 0,

  '&[open]': {
    boxShadow: shadows.tiny,
  },
});

const summaryStyle = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  userSelect: 'none',
  backgroundColor: theme.background.secondary,
  padding: spacing[1.5],
  margin: 0,

  '&::marker': { content: '""' },
});

const markerStyle = css({
  margin: `0 ${spacing[1.5]}px`,
  transform: 'rotate(-90deg)',
  transition: `transform ${durations.hover}`,

  'details[open] &': { transform: 'rotate(0)' },
});

const contentStyle = css({
  padding: `${spacing[2]}px ${spacing[4]}px 0`,

  p: {
    marginLeft: 0,
  },
});

// TODO(cedric): remove everything below this line once we switch to MDX v2,
// that won't support separate <details> and <summary> tags.

// To implement this collapsible with MDX v1, without changing the pages, we need to add them separately to markdown.

/** @deprecated please use `<Collapsible>` instead of `<DETAILS>` */
export const DETAILS = ({
  children,
  ...rest
}: PropsWithChildren<Pick<HTMLDetailsElement, 'open'>>) => {
  // Pull out the `<summary>` to style the content differently.
  const childrenList = React.Children.toArray(children);
  const summary = childrenList.find(node => nodeIsTag(node, 'summary'));
  if (summary) {
    childrenList.splice(childrenList.indexOf(summary), 1);
  }

  return (
    <details css={detailsStyle} {...rest}>
      {summary}
      <div css={contentStyle}>{childrenList}</div>
    </details>
  );
};

/** @deprecated please use `<Collapsible>` instead of `<summary>` */
export const SUMMARY = ({ children }: PropsWithChildren<object>) => (
  <summary css={summaryStyle}>
    <ChevronDownIcon css={markerStyle} size={iconSize.small} />
    <HEADLINE tag="span">{children}</HEADLINE>
  </summary>
);

function nodeIsTag(node: ReactNode, tag: string) {
  return typeof node === 'object' ? (node as any).props?.originalType === tag : false;
}
