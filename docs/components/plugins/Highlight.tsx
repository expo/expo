import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import { ReactNode } from 'react';

const STYLES_HIGHLIGHT_YELLOW = css`
  text-shadow:
    ${theme.palette.yellow7} 0px 0px 10px,
    ${theme.palette.yellow7} 0px 0px 10px,
    ${theme.palette.yellow7} 0px 0px 10px,
    ${theme.palette.yellow7} 0px 0px 10px;
`;

const STYLES_HIGHLIGHT_BLUE = css`
  text-shadow:
    ${theme.palette.blue7} 0px 0px 10px,
    ${theme.palette.blue7} 0px 0px 10px,
    ${theme.palette.blue7} 0px 0px 10px,
    ${theme.palette.blue7} 0px 0px 10px;
`;

type Props = {
  children: ReactNode;
  isBlue?: boolean;
};

const Highlight = ({ children, isBlue }: Props) => {
  if (isBlue) {
    return <span css={STYLES_HIGHLIGHT_BLUE}>{children}</span>;
  }

  return <span css={STYLES_HIGHLIGHT_YELLOW}>{children}</span>;
};

export default Highlight;
