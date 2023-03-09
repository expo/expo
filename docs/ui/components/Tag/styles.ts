import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import { borderRadius, spacing } from '@expo/styleguide-base';

export const tagStyle = css({
  display: 'inline-flex',
  backgroundColor: theme.background.element,
  color: theme.text.default,
  fontSize: '90%',
  padding: `${spacing[1]}px ${spacing[2]}px`,
  marginBottom: spacing[3],
  marginRight: spacing[2],
  borderRadius: borderRadius.sm,
  border: `1px solid ${theme.border.default}`,
  alignItems: 'center',
  gap: spacing[1],

  'table &': {
    marginTop: 0,
    marginBottom: spacing[2],
    padding: `${spacing[0.5]}px ${spacing[1.5]}px`,
  },

  'nav &': {
    whiteSpace: 'pre',
  },

  'h3 &': {
    fontSize: '80%',
  },
});

export const labelStyle = css({
  lineHeight: `${spacing[4]}px`,
  fontWeight: 'normal',
});

export const tagToCStyle = css({
  fontSize: '0.7rem',
  marginBottom: 0,
  marginRight: 0,
  marginLeft: spacing[1],
  padding: `0 ${spacing[1.5]}px`,
});
