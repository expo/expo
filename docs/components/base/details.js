import styled, { keyframes, css } from 'react-emotion';

import * as React from 'react';
import * as Constants from '~/common/constants';

const STYLES_DETAILS = css`
  margin-bottom: 0px;
`;

const STYLES_SUMMARY = css`
  margin-bottom: 0px;
  font-family: ${Constants.fontFamilies.bold};
  font-weight: 400;
  letter-spacing: 0.3px;
`;

export const ExpoKitDetails = ({ children }) => (
  <details className={STYLES_DETAILS}>
    <summary className={STYLES_SUMMARY}>ExpoKit</summary>
    {children}
  </details>
);

export const BareWorkflowDetails = ({ children }) => (
  <details className={STYLES_DETAILS}>
    <summary className={STYLES_SUMMARY}>Bare Workflow</summary>
    {children}
  </details>
);
