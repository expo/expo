import React from 'react';
import { css } from 'react-emotion';

const STYLES_HIGHLIGHT = css`
  text-shadow: rgba(255, 255, 0, 1) 0px 0px 10px, rgba(255, 255, 0, 1) 0px 0px 10px,
    rgba(255, 255, 0, 1) 0px 0px 10px, rgba(255, 255, 0, 1) 0px 0px 10px;
`;

const Highlight = ({ children }) => <span className={`${STYLES_HIGHLIGHT}`}>{children}</span>;

export default Highlight;
