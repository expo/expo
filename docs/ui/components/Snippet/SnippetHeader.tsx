import { css } from '@emotion/react';
import { borderRadius, theme, darkTheme } from '@expo/styleguide';
import { PropsWithChildren } from 'react';

import { LABEL } from '~/ui/components/Text';

type SnippetHeaderProps = PropsWithChildren<{
  title: string;
  alwaysDark?: boolean;
}>;

export const SnippetHeader = ({ title, children, alwaysDark = false }: SnippetHeaderProps) => (
  <div css={[headerStyle, alwaysDark && headerDarkStyle]}>
    <LABEL css={[headerTitleStyle, alwaysDark && { color: darkTheme.text.default }]}>{title}</LABEL>
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
`;

const headerDarkStyle = css`
  background-color: ${darkTheme.background.element};
  border-color: transparent;
  padding-right: 8px;
`;

const headerTitleStyle = css`
  line-height: 42px !important;
  user-select: none;
  font-weight: 500;
`;

const headerActionsStyle = css`
  display: flex;
  justify-content: flex-end;
  align-items: center;
`;
