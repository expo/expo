import { css } from '@emotion/react';
import { theme, spacing } from '@expo/styleguide';
import * as React from 'react';

import { CALLOUT } from '../Text';

type SidebarTitleProps = React.PropsWithChildren<object>;

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
