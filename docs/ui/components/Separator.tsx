import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import { spacing as themeSpacing } from '@expo/styleguide-base';

type SeparatorProps = {
  spacing?: number;
};

export const Separator = ({ spacing }: SeparatorProps) => (
  <hr
    css={css({
      marginTop: spacing ?? themeSpacing[4],
      marginBottom: spacing ?? themeSpacing[6],
      backgroundColor: theme.border.default,
      border: 0,
      height: '0.05rem',
    })}
  />
);
