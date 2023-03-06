import { css } from '@emotion/react';
import { theme, typography } from '@expo/styleguide';
import { spacing } from '@expo/styleguide-base';

export const itemStyle = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacing[3],
  wordBreak: 'break-word',
});

export const contentStyle = css({
  mark: {
    opacity: 0.75,
  },
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

export const footerArrowStyle = css({
  display: 'inline-block',
  position: 'relative',
  margin: `0 ${spacing[1]}px`,
  top: 2,
});

export const externalLinkStyles = css({
  alignSelf: 'center',
  marginLeft: 'auto',
  flexShrink: 0,
});
