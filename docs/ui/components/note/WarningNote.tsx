import { css } from '@emotion/react';
import { iconSize, theme } from '@expo/styleguide';
import React from 'react';

import { InfoNote, NoteProps } from './InfoNote';

import { WarningIcon } from '~/ui/foundations/icons';

export const WarningNote = (props: NoteProps) => (
  <InfoNote css={containerStyle} icon={<WarningIcon size={iconSize.small} />} {...props} />
);

const containerStyle = css`
  background-color: ${theme.background.warning};
  border-color: ${theme.border.warning};
`;
