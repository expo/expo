import { css } from '@emotion/react';
import React from 'react';

type SpacerProps = {
  size?: 4 | 8 | 16 | 24;
  orientation: 'horizontal' | 'vertical';
};

export const Spacer = ({ orientation, size = 8 }: SpacerProps) => (
  <div css={css({ [orientation === 'vertical' ? 'height' : 'width']: size })} />
);
