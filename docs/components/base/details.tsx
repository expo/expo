import { css } from '@emotion/core';
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

export const ExpoKitDetails: React.FC = ({ children }) => (
  <details css={STYLES_DETAILS}>
    <summary css={STYLES_SUMMARY}>ExpoKit</summary>
    <div css={STYLES_CONTENTS}>{children}</div>
  </details>
);

export const BareWorkflowDetails: React.FC = ({ children }) => (
  <details css={STYLES_DETAILS}>
    <summary css={STYLES_SUMMARY}>Bare Workflow</summary>
    <div css={STYLES_CONTENTS}>{children}</div>
  </details>
);
