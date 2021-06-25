import { CSSObject } from '@emotion/react';
import { theme, shadows, borderRadius } from '@expo/styleguide';

import { textStyles } from '~/ui/foundations/typography';

export const styles: { [key: string]: CSSObject } = {
  input: {
    ...textStyles.p,
    width: '100%',
    padding: 12,
    boxSizing: 'border-box',
    borderRadius: borderRadius.medium,
    boxShadow: shadows.input,
    background: theme.background.default,
    border: `1px solid ${theme.border.default}`,
    outline: 'none',
    position: 'relative',
    ':focus': {
      transition: 'border 100ms',
      outline: 'none',
      borderColor: theme.link.default,
    },
  },
  error: {
    borderColor: theme.border.error,
  },
  screenReaderOnly: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    clip: 'rect(0,0,0,0)',
    whiteSpace: 'nowrap',
    clipPath: 'inset(50%)',
    border: 0,
  },
};
