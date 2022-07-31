import { css } from '@emotion/react';
import { theme, typography, spacing } from '@expo/styleguide';
import * as React from 'react';

type SidebarTitleProps = React.PropsWithChildren<object>;

export const SidebarTitle = ({ children }: SidebarTitleProps) => (
  <div css={STYLES_TITLE}>{children}</div>
);

const STYLES_TITLE = css({
  ...typography.fontSizes[14],
  display: 'block',
  position: 'relative',
  marginBottom: spacing[3],
  fontFamily: typography.fontFaces.medium,
  borderBottom: `1px solid ${theme.border.default}`,
  paddingLeft: spacing[6],
  paddingBottom: spacing[2],
  marginRight: -spacing[5],
  color: theme.text.default,
  userSelect: 'none',
});
