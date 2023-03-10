import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import { borderRadius, palette } from '@expo/styleguide-base';
import { PropsWithChildren } from 'react';

import { LABEL } from '~/ui/components/Text';

type SnippetHeaderProps = PropsWithChildren<{
  title: string;
  alwaysDark?: boolean;
}>;

export const SnippetHeader = ({ title, children, alwaysDark = false }: SnippetHeaderProps) => (
  <div css={[headerStyle, alwaysDark && headerDarkStyle]}>
    <LABEL css={[headerTitleStyle, alwaysDark && { color: palette.white }]}>{title}</LABEL>
    {!!children && <div css={headerActionsStyle}>{children}</div>}
  </div>
);

const headerStyle = css`
  background-color: ${theme.background.default};
  border: 1px solid ${theme.border.default};
  border-bottom: none;
  border-top-left-radius: ${borderRadius.md}px;
  border-top-right-radius: ${borderRadius.md}px;
  display: flex;
  padding: 0 0 0 16px;
  justify-content: space-between;
  min-height: 42px;
  max-height: 42px;
  overflow: hidden;
`;

const headerDarkStyle = css`
  background-color: ${palette.dark.gray3};
  border-color: transparent;
  padding-right: 8px;
`;

const headerTitleStyle = css`
  height: 42px;
  line-height: 42px !important;
  user-select: none;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  padding-right: 16px;
`;

const headerActionsStyle = css`
  display: flex;
  justify-content: flex-end;
  align-items: center;
`;
