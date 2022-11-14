import { css } from '@emotion/react';
import { spacing, theme, typography } from '@expo/styleguide';

export const itemStyle = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacing[2.5],
  wordBreak: 'break-word',
});

export const itemIconWrapperStyle = css({
  flexShrink: 0,
});

export const footnoteStyle = css({
  ...typography.fontSizes[12],
  color: theme.icon.secondary,

  mark: {
    opacity: 0.65,
  },
});
