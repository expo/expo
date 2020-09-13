import styled, { keyframes, css } from 'react-emotion';

import * as React from 'react';
import * as Constants from '~/common/constants';

const STYLES_CONTAINER = css`
  width: 100%;
`;

const STYLES_HEADER = css`
  border-bottom: 1px solid ${Constants.expoColors.gray[250]};
`;

const STYLES_CONTENT = css`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
  max-width: 1248px;
  margin: 0 auto 0 auto;
`;

const STYLES_LEFT = css`
  flex-shrink: 0;
  border-right: 1px solid ${Constants.expoColors.gray[250]};
  max-width: 280px;
  transition: 200ms ease max-width;

  @media screen and (max-width: 1200px) {
    max-width: 280px;
  }

  @media screen and (max-width: ${Constants.breakpoints.mobile}) {
    display: none;
  }
`;

const STYLES_RIGHT = css`
  min-width: 5%;
  min-height: 100vh;
  width: 100%;
`;

const DocumentationPageLayout = props => {
  return (
    <div className={STYLES_CONTAINER}>
      <div className={STYLES_HEADER}>{props.header}</div>
      <div className={STYLES_CONTENT}>
        <div className={STYLES_LEFT}>{props.sidebar}</div>
        <div className={STYLES_RIGHT}>{props.children}</div>
      </div>
    </div>
  );
};

export default DocumentationPageLayout;
