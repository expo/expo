import { css } from '@emotion/react';
import { borderRadius, iconSize, shadows, spacing, theme } from '@expo/styleguide';
import React, { PropsWithChildren, ReactNode } from 'react';

import { HEADLINE, P } from '~/ui/components/Text';
import { TriangleDownIcon } from '~/ui/foundations/icons';

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
          <TriangleDownIcon css={markerStyle} size={iconSize.small} />
        </div>
        <HEADLINE tag="span">{summary}</HEADLINE>
      </summary>
      <P css={contentStyle}>{children}</P>
    </details>
  );
}

export function ExpoKitCollapsible({ children }: CollapsibleProps) {
  return (
    <div css={configDetailsStyle}>
      <Collapsible summary="ExpoKit">{children}</Collapsible>
    </div>
  );
}

export function BareWorkflowCollapsible({ children }: CollapsibleProps) {
  return (
    <div css={configDetailsStyle}>
      <Collapsible summary="Bare Workflow">{children}</Collapsible>
    </div>
  );
}

const detailsStyle = css({
  overflow: 'hidden',
  background: theme.background.default,
  border: `1px solid ${theme.border.default}`,
  borderRadius: borderRadius.medium,
  padding: 0,
  marginBottom: spacing[3],

  '&[open]': {
    boxShadow: shadows.micro,
  },

  'h4 + &, li > &': {
    marginTop: spacing[3],
  },
});

const summaryStyle = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  userSelect: 'none',
  listStyle: 'none',
  backgroundColor: theme.background.secondary,
  padding: spacing[1.5],
  paddingRight: spacing[3],
  margin: 0,
  cursor: 'pointer',

  '&:hover span': {
    color: theme.text.secondary,
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

const configDetailsStyle = css({
  marginTop: spacing[3],

  '& details[open]': {
    paddingBottom: spacing[4],
  },
});
