import { css } from '@emotion/react';
import { iconSize, spacing, typography } from '@expo/styleguide';
import React, { PropsWithChildren } from 'react';

import { NavigationRenderProps } from '.';

import { Collapsible } from '~/ui/components/Collapsible';
import { CALLOUT } from '~/ui/components/Text';
import { durations } from '~/ui/foundations/durations';
import { ChevronDownIcon } from '~/ui/foundations/icons';

type SectionListProps = PropsWithChildren<NavigationRenderProps>;

export function SectionList({ route, isActive, children }: SectionListProps) {
  if (route.type !== 'section') {
    throw new Error(`Navigation route is not a section`);
  }

  return (
    <Collapsible
      css={detailsStyle}
      open={isActive || route.expanded}
      summary={
        <div css={summaryStyle}>
          <ChevronDownIcon css={iconStyle} size={iconSize.small} />
          <CALLOUT css={textStyle} tag="span">
            {route.name}
          </CALLOUT>
        </div>
      }>
      {children}
    </Collapsible>
  );
}

const detailsStyle = css({
  paddingTop: spacing[3],
  marginBottom: spacing[3],
});

const summaryStyle = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  listStyle: 'none',
  userSelect: 'none',
  margin: `0 ${spacing[4]}px`,
});

const iconStyle = css({
  flexShrink: 0,
  transform: 'rotate(-90deg)',
  transition: `transform ${durations.hover}`,

  'details[open] &': { transform: 'rotate(0)' },
});

const textStyle = css({
  ...typography.utility.weight.medium,
  padding: spacing[1.5],
});
