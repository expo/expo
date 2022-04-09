import { spacing, typography } from '@expo/styleguide';
import React from 'react';

import { Button, ButtonProps } from '~/ui/components/Button';

export const HomeButton = ({ children, style, ...rest }: ButtonProps) => (
  <Button
    {...rest}
    style={{
      ...typography.fontSizes[14],
      height: 36,
      paddingLeft: spacing[3],
      paddingRight: spacing[3],
      position: 'absolute',
      bottom: 28,
      zIndex: 10,
      ...style,
    }}>
    {children}
  </Button>
);
