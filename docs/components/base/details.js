import styled, { keyframes, css } from 'react-emotion';

import * as React from 'react';
import * as Constants from '~/constants/theme';

const STYLES_DETAILS = css`
  margin-bottom: 0px;
`;

const STYLES_SUMMARY = css`
  margin-bottom: 0px;
  font-family: ${Constants.fontFamilies.demi};
  font-weight: 400;
`;

const STYLES_CONTENTS = css`
  margin-left: 1rem;
`;

export const ExpoKitDetails = ({ children }) => (
  <details className={STYLES_DETAILS}>
    <summary className={STYLES_SUMMARY}>ExpoKit</summary>
    <div className={STYLES_CONTENTS}>{children}</div>
  </details>
);

export const BareWorkflowDetails = ({ children }) => (
  <details className={STYLES_DETAILS}>
    <summary className={STYLES_SUMMARY}>Bare Workflow</summary>
    <div className={STYLES_CONTENTS}>{children}</div>
  </details>
);
