import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import { spacing } from '@expo/styleguide-base';

export const tagStyle = css({
  display: 'inline-flex',
  backgroundColor: theme.background.element,
  color: theme.text.default,
  fontSize: '90%',
  padding: `${spacing[1]}px ${spacing[2]}px`,
  marginRight: spacing[2],
  borderRadius: 999,
  border: `1px solid ${theme.border.default}`,
  alignItems: 'center',
  gap: spacing[1],

  'table &': {
    marginTop: 0,
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
  lineHeight: `${spacing[4]}px !important`,
  fontWeight: 'normal',
  fontSize: 'inherit !important',
});
