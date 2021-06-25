import { css } from '@emotion/react';
import { iconSize, theme } from '@expo/styleguide';
import React from 'react';

import { InfoNote, NoteProps } from './InfoNote';

import { ErrorIcon } from '~/ui/foundations/icons';

export const ErrorNote = (props: NoteProps) => (
  <InfoNote css={containerStyle} icon={<ErrorIcon size={iconSize.small} />} {...props} />
);

const containerStyle = css`
  background-color: ${theme.background.error};
  border-color: ${theme.border.error};
`;
