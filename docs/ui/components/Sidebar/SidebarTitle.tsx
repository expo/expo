import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
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
  marginBottom: spacing[2],
  borderBottom: `1px solid ${theme.border.default}`,
  marginLeft: spacing[5] + spacing[0.5],
  marginRight: -spacing[4],
  paddingBottom: spacing[2],
  userSelect: 'none',
});
