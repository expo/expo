import { css } from '@emotion/react';
import { typography } from '@expo/styleguide';
import * as React from 'react';

const STYLES_DETAILS = css`
  margin-bottom: 0px;
`;

const STYLES_SUMMARY = css`
  margin-bottom: 0px;
  font-family: ${typography.fontFaces.medium};
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
