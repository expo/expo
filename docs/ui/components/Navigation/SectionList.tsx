import { css } from '@emotion/react';
import { spacing } from '@expo/styleguide-base';
import { ChevronDownIcon } from '@expo/styleguide-icons';
import type { PropsWithChildren } from 'react';

import { NavigationRenderProps } from '.';

import { Collapsible } from '~/ui/components/Collapsible';
import { CALLOUT } from '~/ui/components/Text';
import { durations } from '~/ui/foundations/durations';

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
          <ChevronDownIcon className="icon-sm text-icon-default" css={iconStyle} />
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
  fontWeight: 500,
  padding: spacing[1.5],
});
