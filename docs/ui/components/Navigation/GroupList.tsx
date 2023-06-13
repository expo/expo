import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import { spacing } from '@expo/styleguide-base';
import type { PropsWithChildren } from 'react';

import { NavigationRenderProps } from '.';

import { CALLOUT } from '~/ui/components/Text';

type GroupListProps = PropsWithChildren<NavigationRenderProps>;

export function GroupList({ route, children }: GroupListProps) {
  if (route.type !== 'group') {
    throw new Error(`Navigation route is not a group`);
  }

  return (
    <>
      <CALLOUT css={textStyle}>{route.name}</CALLOUT>
      {children}
    </>
  );
}

const textStyle = css({
  fontWeight: 500,
  borderBottom: `1px solid ${theme.border.default}`,
  padding: spacing[1],
  paddingLeft: spacing[4] + spacing[1.5], // padding + icon width
  marginLeft: spacing[4],
  marginBottom: spacing[2],
});
