import { css } from '@emotion/react';
import { theme, spacing as themeSpacing } from '@expo/styleguide';
import React from 'react';

type SeparatorProps = {
  spacing?: number;
};

export const Spacer = ({ spacing = themeSpacing[6] }: SeparatorProps) => (
  <hr
    css={css({
      marginTop: spacing,
      marginBottom: spacing,
      backgroundColor: theme.border.default,
      border: 0,
      height: 1,
    })}
  />
);
