import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import React from 'react';

const STYLES_HIGHLIGHT = css`
  text-shadow: ${theme.highlight.emphasis} 0px 0px 10px, ${theme.highlight.emphasis} 0px 0px 10px,
    ${theme.highlight.emphasis} 0px 0px 10px, ${theme.highlight.emphasis} 0px 0px 10px;
`;

const Highlight: React.FC = ({ children }) => <span css={STYLES_HIGHLIGHT}>{children}</span>;

export default Highlight;
