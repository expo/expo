import { css } from '@emotion/react';
import { spacing } from '@expo/styleguide-base';
import type { PropsWithChildren } from 'react';

import { CALLOUT } from '../Text';

type SidebarTitleProps = PropsWithChildren;

export const SidebarTitle = ({ children }: SidebarTitleProps) => (
  <div css={STYLES_TITLE}>
    <CALLOUT weight="medium">{children}</CALLOUT>
  </div>
);

const STYLES_TITLE = css({
  display: 'block',
  position: 'relative',
  marginLeft: spacing[3],
  marginRight: -spacing[4],
  paddingBottom: spacing[2],
  userSelect: 'none',
});
