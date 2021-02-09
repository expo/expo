import { css } from '@emotion/core';
import React from 'react';

const STYLES_HIGHLIGHT = css`
  text-shadow: rgba(255, 255, 0, 1) 0px 0px 10px, rgba(255, 255, 0, 1) 0px 0px 10px,
    rgba(255, 255, 0, 1) 0px 0px 10px, rgba(255, 255, 0, 1) 0px 0px 10px;
`;

const Highlight: React.FC = ({ children }) => <span css={STYLES_HIGHLIGHT}>{children}</span>;

export default Highlight;
