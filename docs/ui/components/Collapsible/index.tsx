import { css } from '@emotion/react';
import { shadows, theme } from '@expo/styleguide';
import { borderRadius, spacing } from '@expo/styleguide-base';
import { TriangleDownIcon } from '@expo/styleguide-icons';
import type { PropsWithChildren, ReactNode } from 'react';

import { DEMI } from '~/ui/components/Text';

type CollapsibleProps = PropsWithChildren<{
  /**
   * The content of the collapsible summary.
   */
  summary: ReactNode;
  /**
   * If the collapsible should be rendered "open" by default.
   */
  open?: boolean;
  testID?: string;
}>;

export function Collapsible({ summary, open, testID, children }: CollapsibleProps) {
  return (
    <details css={detailsStyle} open={open} data-testid={testID}>
      <summary css={summaryStyle}>
        <div css={markerWrapperStyle}>
          <TriangleDownIcon className="icon-sm" css={markerStyle} />
        </div>
        <DEMI>{summary}</DEMI>
      </summary>
      <div css={contentStyle}>{children}</div>
    </details>
  );
}

const detailsStyle = css({
  overflow: 'hidden',
  background: theme.background.default,
  border: `1px solid ${theme.border.default}`,
  borderRadius: borderRadius.md,
  padding: 0,
  marginBottom: spacing[3],

  '&[open]': {
    boxShadow: shadows.xs,
  },

  'h4 + &, p + &, li > &': {
    marginTop: spacing[3],
  },
});

const summaryStyle = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  userSelect: 'none',
  listStyle: 'none',
  backgroundColor: theme.background.subtle,
  padding: spacing[1.5],
  paddingRight: spacing[3],
  margin: 0,
  cursor: 'pointer',

  '&:hover span': {
    color: theme.text.secondary,
  },

  '::-webkit-details-marker': {
    display: 'none',
  },

  h4: {
    marginTop: 0,
    marginBottom: 0,
  },

  code: {
    backgroundColor: theme.background.element,
    display: 'inline',
    fontSize: '90%',
  },
});

const markerWrapperStyle = css({
  alignSelf: 'baseline',
  marginTop: 5,
  marginLeft: spacing[1.5],
  marginRight: spacing[2],
});

const markerStyle = css({
  transform: 'rotate(-90deg)',
  transition: `transform 200ms`,

  'details[open] &': { transform: 'rotate(0)' },
});

const contentStyle = css({
  padding: `${spacing[4]}px ${spacing[5]}px 0`,

  p: {
    marginLeft: 0,
  },

  'pre > pre': {
    marginTop: 0,
  },
});
