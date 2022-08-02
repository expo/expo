import { css } from '@emotion/react';
import { borderRadius, spacing, theme } from '@expo/styleguide';

export const tagStyle = css({
  display: 'inline-flex',
  backgroundColor: theme.background.tertiary,
  color: theme.text.default,
  fontSize: '90%',
  fontWeight: 700,
  padding: `${spacing[1]}px ${spacing[2]}px`,
  marginBottom: spacing[3],
  marginRight: spacing[2],
  borderRadius: borderRadius.small,
  border: `1px solid ${theme.border.default}`,
  alignItems: 'center',
  gap: spacing[1],

  'table &': {
    marginTop: 0,
    marginBottom: spacing[2],
    padding: `${spacing[0.5]}px ${spacing[1.5]}px`,
  },
});

export const tagFirstStyle = css({
  marginBottom: 0,
  marginTop: spacing[4],
});

export const labelStyle = css({
  lineHeight: `${spacing[4]}px`,
});

export const tagToCStyle = css({
  fontSize: '0.7rem',
  marginBottom: 0,
  marginRight: 0,
  marginLeft: spacing[1],
  padding: `0px ${spacing[1.5]}px`,
});
