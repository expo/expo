import { css } from '@emotion/react';
import { spacing, theme, typography } from '@expo/styleguide';
import React, { PropsWithChildren } from 'react';

import { NavigationRenderProps } from '.';

import { CALLOUT } from '~/ui/components/Text';

type GroupListProps = PropsWithChildren<NavigationRenderProps>;

export function GroupList({ route, children }: GroupListProps) {
  if (route.type !== 'group') {
    throw new Error(`Navigation node is not a group`);
  }

  return (
    <>
      <CALLOUT css={textStyle}>{route.name}</CALLOUT>
      {children}
    </>
  );
}

const textStyle = css({
  ...typography.utility.weight.medium,
  borderBottom: `1px solid ${theme.border.default}`,
  padding: spacing[1],
  marginLeft: spacing[4],
  marginBottom: spacing[2],
});
